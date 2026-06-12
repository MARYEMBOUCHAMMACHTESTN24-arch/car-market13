<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    /**
     * AI-based car recommendation based on user description
     */
    public function recommend(Request $request)
    {
        $request->validate([
            'description' => 'required|string|min:10',
            'max_price' => 'nullable|numeric|min:0',
            'city' => 'nullable|string',
        ]);

        $description = strtolower($request->description);
        $maxPrice = $request->max_price;
        $city = $request->city;

        $query = Car::query();

        // Apply price filter if provided
        if ($maxPrice) {
            $query->where('price', '<=', $maxPrice);
        }

        // Apply city filter if provided
        if ($city) {
            $query->where('city', $city);
        }

        // Get all cars matching basic filters
        $cars = $query->get();

        // Score each car based on keyword matching
        $scoredCars = $cars->map(function ($car) use ($description) {
            $score = 0;
            $carText = strtolower($car->brand . ' ' . $car->model . ' ' . $car->type . ' ' . $car->city);

            // Brand matching
            if (str_contains($description, strtolower($car->brand))) {
                $score += 30;
            }

            // Model matching
            if (str_contains($description, strtolower($car->model))) {
                $score += 25;
            }

            // Type matching
            if (str_contains($description, strtolower($car->type))) {
                $score += 20;
            }

            // City matching
            if (str_contains($description, strtolower($car->city))) {
                $score += 15;
            }

            // Keyword matching for common car terms
            $keywords = [
                'sport' => ['sports', 'sport', 'racing', 'performance'],
                'luxury' => ['luxury', 'premium', 'high-end', 'lux'],
                'suv' => ['suv', 'crossover', 'family'],
                'sedan' => ['sedan', 'saloon', 'family car'],
                'electric' => ['electric', 'ev', 'hybrid', 'eco'],
                'convertible' => ['convertible', 'cabriolet', 'open top'],
                'hatchback' => ['hatchback', 'compact'],
                'truck' => ['truck', 'pickup', 'utility'],
            ];

            foreach ($keywords as $type => $terms) {
                foreach ($terms as $term) {
                    if (str_contains($description, $term) && str_contains($carText, $type)) {
                        $score += 15;
                    }
                }
            }

            // Year preference (newer cars score higher)
            if (str_contains($description, 'new') || str_contains($description, 'latest') || str_contains($description, 'recent')) {
                $score += ($car->year - 2010) * 0.5;
            }

            // Mileage preference (lower mileage scores higher)
            if (str_contains($description, 'low mileage') || str_contains($description, 'good condition')) {
                $score += max(0, (50000 - $car->mileage) / 1000);
            }

            return [
                'car' => $car,
                'score' => $score,
                'match_reason' => $this->getMatchReason($description, $car, $score),
            ];
        });

        // Sort by score and filter out low matches
        $recommendations = $scoredCars
            ->sortByDesc('score')
            ->filter(fn($item) => $item['score'] > 10)
            ->take(10)
            ->values();

        return response()->json([
            'description' => $request->description,
            'recommendations' => $recommendations,
            'count' => $recommendations->count(),
        ]);
    }

    /**
     * Generate a human-readable match reason
     */
    private function getMatchReason(string $description, Car $car, float $score): string
    {
        $reasons = [];

        if (str_contains($description, strtolower($car->brand))) {
            $reasons[] = 'Brand match';
        }

        if (str_contains($description, strtolower($car->model))) {
            $reasons[] = 'Model match';
        }

        if (str_contains($description, strtolower($car->type))) {
            $reasons[] = 'Type match';
        }

        if (str_contains($description, strtolower($car->city))) {
            $reasons[] = 'Location match';
        }

        if ($score > 50) {
            $reasons[] = 'Excellent match';
        } elseif ($score > 30) {
            $reasons[] = 'Good match';
        } else {
            $reasons[] = 'Partial match';
        }

        return implode(', ', $reasons);
    }
}
