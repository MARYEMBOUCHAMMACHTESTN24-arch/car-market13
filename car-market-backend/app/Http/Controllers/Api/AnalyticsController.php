<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Get analytics data for admin dashboard
     */
    public function index(Request $request)
    {
        // Total revenue from approved orders
        $totalRevenue = Order::where('status', 'approved')
            ->with('car')
            ->get()
            ->sum(function ($order) {
                return $order->car ? $order->car->price : 0;
            });

        // Total orders by status
        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Monthly sales data (last 6 months)
        $monthlySales = Order::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('count(*) as count'),
            DB::raw('SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved')
        )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Most popular cars (by order count)
        $popularCars = Car::select('cars.*', DB::raw('COUNT(orders.id) as order_count'))
            ->leftJoin('orders', 'cars.id', '=', 'orders.car_id')
            ->groupBy('cars.id')
            ->orderByDesc('order_count')
            ->limit(10)
            ->get();

        // Recent orders
        $recentOrders = Order::with(['user', 'car'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Cars with low stock
        $lowStockCars = Car::where('stock', '<=', 3)
            ->orderBy('stock')
            ->get();

        return response()->json([
            'total_revenue' => $totalRevenue,
            'orders_by_status' => [
                'pending' => $ordersByStatus['pending'] ?? 0,
                'approved' => $ordersByStatus['approved'] ?? 0,
                'rejected' => $ordersByStatus['rejected'] ?? 0,
            ],
            'monthly_sales' => $monthlySales,
            'popular_cars' => $popularCars,
            'recent_orders' => $recentOrders,
            'low_stock_cars' => $lowStockCars,
        ]);
    }

    /**
     * Get all data for the new dashboard
     */
    public function getDashboardData()
    {
        // Debug: Log actual counts from database
        $carCount = Car::count();
        $userCount = \App\Models\User::count();
        $orderCount = Order::count();
        $messageCount = \App\Models\Message::count();
        
        \Log::info('Dashboard Data Counts', [
            'cars' => $carCount,
            'users' => $userCount,
            'orders' => $orderCount,
            'messages' => $messageCount
        ]);
        
        $totalRevenue = Order::where('status', 'approved')
            ->with('car')
            ->get()
            ->sum(function ($order) {
                return $order->car ? $order->car->price : 0;
            });

        // Helper to get 12 months data
        $getMonthlyData = function ($model) {
            $data = $model::select(
                DB::raw('DATE_FORMAT(created_at, "%b") as month'),
                DB::raw('count(*) as total')
            )
                ->whereYear('created_at', date('Y'))
                ->groupBy('month')
                ->get()
                ->pluck('total', 'month')
                ->toArray();

            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            $fullData = [];
            foreach ($months as $m) {
                $fullData[] = ['month' => $m, 'total' => $data[$m] ?? 0];
            }
            return $fullData;
        };

        $monthlyOrders = $getMonthlyData(Order::class);
        $monthlyCars = $getMonthlyData(Car::class);

        $carsByCategory = Car::select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->get();

        return response()->json([
            'stats' => [
                'totalCars' => Car::count(),
                'totalUsers' => \App\Models\User::count(),
                'totalOrders' => Order::count(),
                'totalMessages' => \App\Models\Message::count(),
                'revenue' => $totalRevenue,
            ],
            'charts' => [
                'monthlyOrders' => $monthlyOrders,
                'monthlyCars' => $monthlyCars,
                'carsByCategory' => $carsByCategory,
            ],
            'latestCars' => Car::latest()->limit(5)->get(),
            'recentOrders' => Order::with(['user', 'car'])->latest()->limit(5)->get(),
            'recentMessages' => \App\Models\Message::with('user')->latest()->limit(5)->get(),
        ]);
    }
}
