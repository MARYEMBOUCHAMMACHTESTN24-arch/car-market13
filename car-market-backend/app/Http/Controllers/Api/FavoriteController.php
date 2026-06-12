<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        $cars = $request->user()
            ->favorites()
            ->orderByPivot('created_at', 'desc')
            ->get();

        Log::info('Favorites fetched', [
            'user_id' => $request->user()->id,
            'car_ids' => $cars->pluck('id')->all(),
        ]);

        return response()->json($cars);
    }

    public function store(Request $request, int $carId)
    {
        $car = Car::findOrFail($carId);

        $request->user()->favorites()->syncWithoutDetaching([
            $car->id => ['created_at' => now()],
        ]);

        Log::info('Favorite saved', [
            'user_id' => $request->user()->id,
            'car_id' => $car->id,
        ]);

        return response()->json([
            'message' => 'Favorite saved',
            'car_id' => $car->id,
            'is_favorite' => true,
        ]);
    }

    public function destroy(Request $request, int $carId)
    {
        $request->user()->favorites()->detach($carId);

        Log::info('Favorite removed', [
            'user_id' => $request->user()->id,
            'car_id' => $carId,
        ]);

        return response()->json([
            'message' => 'Favorite removed',
            'car_id' => $carId,
            'is_favorite' => false,
        ]);
    }
}
