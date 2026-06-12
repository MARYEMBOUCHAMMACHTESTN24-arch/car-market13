<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\User;
use App\Models\Car;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $cars = Car::all();

        if (!$user || $cars->isEmpty()) return;

        // Spread cars across past 6 months for richer chart data
        $carIndex = 0;
        foreach ($cars as $car) {
            $monthsAgo = $carIndex % 6; // 0-5 months ago
            $car->created_at = now()->subMonths($monthsAgo)->subDays(rand(0, 20));
            $car->save();
            $carIndex++;
        }

        // Delete existing orders to avoid duplicates
        Order::truncate();

        // Create orders spread across multiple months
        $statuses = ['approved', 'approved', 'approved', 'pending', 'pending', 'rejected'];
        foreach ($cars as $i => $car) {
            // Create 1-2 orders per car, spread over past 6 months
            $monthsAgo = $i % 6;
            Order::create([
                'user_id'    => $user->id,
                'car_id'     => $car->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'phone'      => '0612345678',
                'status'     => $statuses[$i % count($statuses)],
                'created_at' => now()->subMonths($monthsAgo)->subDays(rand(1, 15)),
            ]);
        }

        // Add more recent orders for current month
        $recentCars = $cars->take(4);
        foreach ($recentCars as $car) {
            Order::create([
                'user_id'    => $user->id,
                'car_id'     => $car->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'phone'      => '0698765432',
                'status'     => 'approved',
                'created_at' => now()->subDays(rand(1, 10)),
            ]);
        }
    }
}
