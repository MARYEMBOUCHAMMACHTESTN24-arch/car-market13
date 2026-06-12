<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AiAnalyticsController extends Controller
{
    public function getAnalytics(Request $request)
    {
        // For demonstration, returning mock analytics that represents the actual AI functionality.
        // In a true production system, this would query AiUserActivity and logs.
        return response()->json([
            'total_queries' => 842,
            'recommendation_ctr' => 42.8,
            'visual_searches' => 156,
            'avg_latency_ms' => 610,
            'confidence_metrics' => [
                'high' => 600,
                'medium' => 200,
                'low' => 42,
            ],
            'most_searched_intents' => [
                ['intent' => 'Economy', 'count' => 310],
                ['intent' => 'Family', 'count' => 280],
                ['intent' => 'Luxury', 'count' => 140],
                ['intent' => 'Performance', 'count' => 85],
                ['intent' => 'Offroad', 'count' => 27],
            ],
            'recent_queries' => [
                [
                    'query' => 'cheap fuel efficient toyota',
                    'primary_intent' => 'Economy',
                    'confidence' => 'High',
                    'top_match' => 'Toyota Prius'
                ],
                [
                    'query' => 'luxury family suv',
                    'primary_intent' => 'Family',
                    'confidence' => 'High',
                    'top_match' => 'Porsche Macan S'
                ],
                [
                    'query' => 'sporty aggressive sedan',
                    'primary_intent' => 'Performance',
                    'confidence' => 'Medium',
                    'top_match' => 'BMW M4 Competition'
                ]
            ]
        ]);
    }
}
