<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Order;
use App\Models\Offer;
use App\Models\User;
use App\Models\Message;
use App\Models\AiUserActivity;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\JsonResponse;

class BusinessIntelligenceController extends Controller
{
    /**
     * Master BI dashboard endpoint.
     * Returns all KPIs, chart data, and trend metrics from real DB data.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'kpis'          => $this->kpiSummary(),
            'revenue'       => $this->revenueMetrics(),
            'orders'        => $this->orderMetrics(),
            'inventory'     => $this->inventoryMetrics(),
            'users'         => $this->userMetrics(),
            'ai_analytics'  => $this->aiSearchMetrics(),
            'offers'        => $this->offerMetrics(),
            'generated_at'  => now()->toIso8601String(),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  KPI SUMMARY CARDS                                                   */
    /* ------------------------------------------------------------------ */
    private function kpiSummary(): array
    {
        $now      = now();
        $thisMonth = $now->copy()->startOfMonth();
        $lastMonth = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonth()->endOfMonth();

        // Revenue: sum of car prices for approved orders
        $revenueThisMonth = Order::where('orders.status', 'approved')
            ->where('orders.created_at', '>=', $thisMonth)
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->sum('cars.price');

        $revenueLastMonth = Order::where('orders.status', 'approved')
            ->whereBetween('orders.created_at', [$lastMonth, $lastMonthEnd])
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->sum('cars.price');

        $totalRevenue = Order::where('orders.status', 'approved')
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->sum('cars.price');

        $totalOrders    = Order::count();
        $approvedOrders = Order::where('status', 'approved')->count();
        $pendingOrders  = Order::where('status', 'pending')->count();
        $conversionRate = $totalOrders > 0 ? round(($approvedOrders / $totalOrders) * 100, 1) : 0;

        $totalCars      = Car::count();
        $carsThisMonth  = Car::where('created_at', '>=', $thisMonth)->count();
        $carsLastMonth  = Car::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

        $totalUsers     = User::count();
        $usersThisMonth = User::where('created_at', '>=', $thisMonth)->count();
        $usersLastMonth = User::whereBetween('created_at', [$lastMonth, $lastMonthEnd])->count();

        $activeOffers   = Offer::where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->count();

        $avgCarPrice = Car::where('price', '>', 0)->avg('price');

        return [
            'total_revenue'       => (int) $totalRevenue,
            'revenue_this_month'  => (int) $revenueThisMonth,
            'revenue_last_month'  => (int) $revenueLastMonth,
            'revenue_growth'      => $revenueLastMonth > 0
                ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1)
                : null,

            'total_orders'        => $totalOrders,
            'approved_orders'     => $approvedOrders,
            'pending_orders'      => $pendingOrders,
            'conversion_rate'     => $conversionRate,

            'total_cars'          => $totalCars,
            'cars_this_month'     => $carsThisMonth,
            'cars_last_month'     => $carsLastMonth,
            'cars_growth'         => $carsLastMonth > 0
                ? round((($carsThisMonth - $carsLastMonth) / $carsLastMonth) * 100, 1)
                : null,

            'total_users'         => $totalUsers,
            'users_this_month'    => $usersThisMonth,
            'users_last_month'    => $usersLastMonth,
            'users_growth'        => $usersLastMonth > 0
                ? round((($usersThisMonth - $usersLastMonth) / $usersLastMonth) * 100, 1)
                : null,

            'active_offers'       => $activeOffers,
            'avg_car_price'       => round($avgCarPrice ?? 0),
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  REVENUE METRICS                                                     */
    /* ------------------------------------------------------------------ */
    private function revenueMetrics(): array
    {
        // Monthly revenue trend — last 12 months
        $monthlyRevenue = DB::table('orders')
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->where('orders.status', 'approved')
            ->where('orders.created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("DATE_FORMAT(orders.created_at, '%Y-%m') as month_key")
            ->selectRaw("DATE_FORMAT(orders.created_at, '%b %Y') as month")
            ->selectRaw("SUM(cars.price) as revenue")
            ->selectRaw("COUNT(orders.id) as deals")
            ->groupBy('month_key', 'month')
            ->orderBy('month_key')
            ->get()
            ->map(fn($r) => [
                'month'   => $r->month,
                'revenue' => (int) $r->revenue,
                'deals'   => (int) $r->deals,
            ])
            ->values()
            ->all();

        // Revenue by brand (top 8)
        $revenueByBrand = DB::table('orders')
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->where('orders.status', 'approved')
            ->selectRaw("cars.brand, SUM(cars.price) as revenue, COUNT(orders.id) as deals")
            ->groupBy('cars.brand')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get()
            ->map(fn($r) => [
                'brand'   => $r->brand,
                'revenue' => (int) $r->revenue,
                'deals'   => (int) $r->deals,
            ])
            ->values()
            ->all();

        // Average deal value by category
        $avgValueByCategory = DB::table('orders')
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->where('orders.status', 'approved')
            ->whereNotNull('cars.category')
            ->where('cars.category', '!=', '')
            ->selectRaw("cars.category, AVG(cars.price) as avg_price, COUNT(orders.id) as deals")
            ->groupBy('cars.category')
            ->orderByDesc('avg_price')
            ->limit(8)
            ->get()
            ->map(fn($r) => [
                'category'  => $r->category,
                'avg_price' => round($r->avg_price),
                'deals'     => (int) $r->deals,
            ])
            ->values()
            ->all();

        return [
            'monthly_trend'        => $monthlyRevenue,
            'by_brand'             => $revenueByBrand,
            'avg_value_by_category'=> $avgValueByCategory,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  ORDER METRICS                                                       */
    /* ------------------------------------------------------------------ */
    private function orderMetrics(): array
    {
        // Status breakdown
        $byStatus = Order::selectRaw("status, COUNT(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status');

        $pending  = (int) ($byStatus['pending']  ?? 0);
        $approved = (int) ($byStatus['approved'] ?? 0);
        $rejected = (int) ($byStatus['rejected'] ?? 0);
        $total    = $pending + $approved + $rejected;

        // Monthly orders — last 12 months
        $monthlyOrders = DB::table('orders')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key")
            ->selectRaw("DATE_FORMAT(created_at, '%b') as month")
            ->selectRaw("COUNT(*) as total")
            ->selectRaw("SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END) as approved")
            ->selectRaw("SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) as rejected")
            ->groupBy('month_key', 'month')
            ->orderBy('month_key')
            ->get()
            ->map(fn($r) => [
                'month'    => $r->month,
                'total'    => (int) $r->total,
                'approved' => (int) $r->approved,
                'pending'  => (int) $r->pending,
                'rejected' => (int) $r->rejected,
            ])
            ->values()
            ->all();

        // Top 5 cars by orders placed
        $topCarsByOrders = DB::table('orders')
            ->join('cars', 'orders.car_id', '=', 'cars.id')
            ->selectRaw("cars.id, cars.brand, cars.model, cars.year, cars.price, cars.main_image, COUNT(orders.id) as order_count")
            ->selectRaw("SUM(CASE WHEN orders.status='approved' THEN 1 ELSE 0 END) as approved_count")
            ->groupBy('cars.id', 'cars.brand', 'cars.model', 'cars.year', 'cars.price', 'cars.main_image')
            ->orderByDesc('order_count')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'id'             => $r->id,
                'title'          => "{$r->brand} {$r->model} ({$r->year})",
                'price'          => (int) $r->price,
                'order_count'    => (int) $r->order_count,
                'approved_count' => (int) $r->approved_count,
            ])
            ->values()
            ->all();

        // Orders with appointment (test drive) vs without
        $withAppointment = Order::whereNotNull('appointment_date')->count();
        $withoutAppointment = $total - $withAppointment;

        return [
            'status_breakdown' => [
                ['name' => 'Pending',  'value' => $pending,  'color' => '#f59e0b'],
                ['name' => 'Approved', 'value' => $approved, 'color' => '#10b981'],
                ['name' => 'Rejected', 'value' => $rejected, 'color' => '#ef4444'],
            ],
            'monthly_trend'    => $monthlyOrders,
            'top_cars'         => $topCarsByOrders,
            'appointment_rate' => $total > 0 ? round(($withAppointment / $total) * 100, 1) : 0,
            'with_appointment' => $withAppointment,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  INVENTORY METRICS                                                   */
    /* ------------------------------------------------------------------ */
    private function inventoryMetrics(): array
    {
        // Inventory by brand (top 12)
        $byBrand = Car::selectRaw("brand, COUNT(*) as count, AVG(price) as avg_price, MIN(price) as min_price, MAX(price) as max_price")
            ->where('price', '>', 0)
            ->groupBy('brand')
            ->orderByDesc('count')
            ->limit(12)
            ->get()
            ->map(fn($r) => [
                'brand'     => $r->brand,
                'count'     => (int) $r->count,
                'avg_price' => round($r->avg_price),
                'min_price' => (int) $r->min_price,
                'max_price' => (int) $r->max_price,
            ])
            ->values()
            ->all();

        // Fuel type distribution
        $byFuel = Car::selectRaw("fuel_type, COUNT(*) as count")
            ->whereNotNull('fuel_type')
            ->where('fuel_type', '!=', '')
            ->groupBy('fuel_type')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => ['name' => $r->fuel_type, 'value' => (int) $r->count])
            ->values()
            ->all();

        // Transmission split
        $byTransmission = Car::selectRaw("transmission, COUNT(*) as count")
            ->whereNotNull('transmission')
            ->where('transmission', '!=', '')
            ->groupBy('transmission')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => ['name' => $r->transmission, 'value' => (int) $r->count])
            ->values()
            ->all();

        // Price bracket distribution
        $priceBrackets = [
            ['label' => '< 100K',      'min' => 0,       'max' => 100000],
            ['label' => '100K–250K',   'min' => 100000,  'max' => 250000],
            ['label' => '250K–500K',   'min' => 250000,  'max' => 500000],
            ['label' => '500K–800K',   'min' => 500000,  'max' => 800000],
            ['label' => '800K–1.5M',   'min' => 800000,  'max' => 1500000],
            ['label' => '> 1.5M',      'min' => 1500000, 'max' => PHP_INT_MAX],
        ];

        $priceDistribution = array_map(function ($bracket) {
            $count = Car::where('price', '>', $bracket['min'])
                ->where('price', '<=', $bracket['max'])
                ->count();
            return ['range' => $bracket['label'], 'count' => $count];
        }, $priceBrackets);

        // Year distribution (last 20 years)
        $byYear = Car::selectRaw("year, COUNT(*) as count")
            ->where('year', '>=', now()->year - 20)
            ->groupBy('year')
            ->orderBy('year')
            ->get()
            ->map(fn($r) => ['year' => (string) $r->year, 'count' => (int) $r->count])
            ->values()
            ->all();

        // Mileage brackets
        $mileageBrackets = [
            ['label' => '0–20K km',      'max' => 20000],
            ['label' => '20K–60K km',    'max' => 60000],
            ['label' => '60K–120K km',   'max' => 120000],
            ['label' => '120K–200K km',  'max' => 200000],
            ['label' => '200K+ km',      'max' => PHP_INT_MAX],
        ];

        $mileageDistribution = [];
        $prevMax = 0;
        foreach ($mileageBrackets as $bracket) {
            $count = Car::where('mileage', '>', $prevMax)
                ->where('mileage', '<=', $bracket['max'])
                ->count();
            $mileageDistribution[] = ['range' => $bracket['label'], 'count' => $count];
            $prevMax = $bracket['max'];
        }

        // Top favorited cars
        $topFavorited = DB::table('favorites')
            ->join('cars', 'favorites.car_id', '=', 'cars.id')
            ->selectRaw("cars.id, cars.brand, cars.model, cars.year, cars.price, COUNT(favorites.user_id) as fav_count")
            ->groupBy('cars.id', 'cars.brand', 'cars.model', 'cars.year', 'cars.price')
            ->orderByDesc('fav_count')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'id'        => $r->id,
                'title'     => "{$r->brand} {$r->model} ({$r->year})",
                'price'     => (int) $r->price,
                'favorites' => (int) $r->fav_count,
            ])
            ->values()
            ->all();

        // Category breakdown
        $byCategory = Car::selectRaw("category, COUNT(*) as count")
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->groupBy('category')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['category' => $r->category, 'count' => (int) $r->count])
            ->values()
            ->all();

        return [
            'by_brand'           => $byBrand,
            'by_fuel'            => $byFuel,
            'by_transmission'    => $byTransmission,
            'price_distribution' => $priceDistribution,
            'mileage_distribution' => $mileageDistribution,
            'by_year'            => $byYear,
            'top_favorited'      => $topFavorited,
            'by_category'        => $byCategory,
            'premium_count'      => Car::where('is_premium', true)->count(),
            'featured_count'     => Car::where('is_featured', true)->count(),
            'suspicious_price_count' => Car::where('is_suspicious_price', true)->count(),
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  USER METRICS                                                        */
    /* ------------------------------------------------------------------ */
    private function userMetrics(): array
    {
        // Monthly user registrations (last 12 months)
        $monthlyRegistrations = DB::table('users')
            ->where('created_at', '>=', now()->subMonths(12)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key")
            ->selectRaw("DATE_FORMAT(created_at, '%b') as month")
            ->selectRaw("COUNT(*) as registrations")
            ->groupBy('month_key', 'month')
            ->orderBy('month_key')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'registrations' => (int) $r->registrations])
            ->values()
            ->all();

        // Users with orders (active buyers)
        $usersWithOrders = DB::table('orders')->distinct('user_id')->count('user_id');
        $totalUsers      = User::count();
        $buyerRate       = $totalUsers > 0 ? round(($usersWithOrders / $totalUsers) * 100, 1) : 0;

        // Users by role
        $byRole = User::selectRaw("role, COUNT(*) as count")
            ->groupBy('role')
            ->get()
            ->map(fn($r) => ['role' => $r->role ?? 'user', 'count' => (int) $r->count])
            ->values()
            ->all();

        // Top buyers (users with most approved orders)
        $topBuyers = DB::table('orders')
            ->join('users', 'orders.user_id', '=', 'users.id')
            ->where('orders.status', 'approved')
            ->selectRaw("users.id, users.name, users.email, COUNT(orders.id) as order_count")
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('order_count')
            ->limit(5)
            ->get()
            ->map(fn($r) => [
                'name'        => $r->name,
                'email'       => $r->email,
                'order_count' => (int) $r->order_count,
            ])
            ->values()
            ->all();

        return [
            'monthly_registrations' => $monthlyRegistrations,
            'users_with_orders'     => $usersWithOrders,
            'buyer_rate'            => $buyerRate,
            'by_role'               => $byRole,
            'top_buyers'            => $topBuyers,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  AI SEARCH ANALYTICS                                                 */
    /* ------------------------------------------------------------------ */
    private function aiSearchMetrics(): array
    {
        // Check if table exists and has data
        if (!DB::getSchemaBuilder()->hasTable('ai_user_activities')) {
            return ['total_searches' => 0, 'top_queries' => [], 'event_breakdown' => []];
        }

        $totalSearches = AiUserActivity::where('event_type', 'search')->count();

        // Top search queries
        $topQueries = AiUserActivity::where('event_type', 'search')
            ->whereNotNull('query')
            ->where('query', '!=', '')
            ->selectRaw("query, COUNT(*) as count")
            ->groupBy('query')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn($r) => ['query' => $r->query, 'count' => (int) $r->count])
            ->values()
            ->all();

        // Event type breakdown (search, view, favorite, compare, click)
        $eventBreakdown = AiUserActivity::selectRaw("event_type, COUNT(*) as count")
            ->groupBy('event_type')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => ['event' => $r->event_type, 'count' => (int) $r->count])
            ->values()
            ->all();

        // Daily AI activity (last 14 days)
        $dailyActivity = AiUserActivity::where('created_at', '>=', now()->subDays(14))
            ->selectRaw("DATE(created_at) as day, COUNT(*) as count")
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn($r) => ['day' => $r->day, 'count' => (int) $r->count])
            ->values()
            ->all();

        return [
            'total_searches'  => $totalSearches,
            'top_queries'     => $topQueries,
            'event_breakdown' => $eventBreakdown,
            'daily_activity'  => $dailyActivity,
        ];
    }

    /* ------------------------------------------------------------------ */
    /*  OFFER METRICS                                                       */
    /* ------------------------------------------------------------------ */
    private function offerMetrics(): array
    {
        $now = now();

        $totalOffers  = Offer::count();
        $activeOffers = Offer::where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->count();
        $expiredOffers = Offer::where('end_date', '<', $now)->count();
        $expiringSoon  = Offer::where('is_active', true)
            ->where('end_date', '>=', $now)
            ->where('end_date', '<=', $now->copy()->addDays(7))
            ->count();

        // Avg discount offered
        $avgDiscount = Offer::where('discount_type', 'percentage')
            ->where('discount', '>', 0)
            ->avg('discount_percentage') ?? Offer::where('discount', '>', 0)->avg('discount');

        // Offers over time (monthly)
        $monthlyOffers = DB::table('offers')
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month_key")
            ->selectRaw("DATE_FORMAT(created_at, '%b') as month")
            ->selectRaw("COUNT(*) as total")
            ->selectRaw("SUM(is_active) as active")
            ->groupBy('month_key', 'month')
            ->orderBy('month_key')
            ->get()
            ->map(fn($r) => [
                'month'  => $r->month,
                'total'  => (int) $r->total,
                'active' => (int) $r->active,
            ])
            ->values()
            ->all();

        return [
            'total'          => $totalOffers,
            'active'         => $activeOffers,
            'expired'        => $expiredOffers,
            'expiring_soon'  => $expiringSoon,
            'avg_discount'   => round($avgDiscount ?? 0, 1),
            'monthly_trend'  => $monthlyOffers,
        ];
    }
}
