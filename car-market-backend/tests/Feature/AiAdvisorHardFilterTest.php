<?php

namespace Tests\Feature;

use App\Models\Car;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request as HttpRequest;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AiAdvisorHardFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_unavailable_explicit_brand_returns_no_inventory_without_ai_fallback(): void
    {
        $this->createCar('BMW', 'M4 Coupe');
        $this->createCar('Mercedes-Benz', 'C-Class');

        Http::fake();

        $response = $this->postJson('/api/ai/search', [
            'query' => 'Do you have Tesla cars?',
        ]);

        $response->assertOk()
            ->assertJsonPath('count', 0)
            ->assertJsonPath('filtered_catalog_size', 0)
            ->assertJsonPath('engine', 'inventory-grounded-hard-sql-filter')
            ->assertJsonPath('inventory_answer', 'Currently, no Tesla vehicles are available in the marketplace inventory.');

        Http::assertNothingSent();
    }

    public function test_explicit_brand_filters_database_payload_before_semantic_ranking(): void
    {
        $mercedes = $this->createCar('Mercedes-Benz', 'GLE SUV');
        $this->createCar('BMW', 'X5 SUV');

        $sentPayload = null;
        Http::fake(function (HttpRequest $request) use (&$sentPayload, $mercedes) {
            $sentPayload = $request->data();

            return Http::response([
                'query' => $sentPayload['query'],
                'engine' => 'fake-ai',
                'catalog_size' => count($sentPayload['cars']),
                'filtered_catalog_size' => count($sentPayload['cars']),
                'results' => [[
                    'car' => $sentPayload['cars'][0],
                    'score' => 95,
                    'ai_match_percentage' => 95,
                    'reasons' => ['Filtered Mercedes inventory only.'],
                ]],
                'recommendations' => [],
            ], 200);
        });

        $response = $this->postJson('/api/ai/search', [
            'query' => 'Do you have Mercedes cars?',
        ]);

        $response->assertOk()
            ->assertJsonPath('count', 1)
            ->assertJsonPath('results.0.car.id', $mercedes->id)
            ->assertJsonPath('results.0.car.brand', 'Mercedes-Benz');

        $this->assertNotNull($sentPayload);
        $this->assertCount(1, $sentPayload['cars']);
        $this->assertSame('Mercedes-Benz', $sentPayload['cars'][0]['brand']);

        Http::assertSentCount(1);
    }

    public function test_unrelated_query_is_redirected_without_inventory_retrieval_or_ai_call(): void
    {
        $this->createCar('Toyota', 'Tacoma SR5');

        Http::fake();

        $response = $this->postJson('/api/ai/search', [
            'query' => 'what is football',
        ]);

        $response->assertOk()
            ->assertJsonPath('count', 0)
            ->assertJsonPath('ai_confidence', 'Out of Scope')
            ->assertJsonPath('engine', 'automotive-marketplace-assistant')
            ->assertJsonPath('inventory_answer', "I'm specialized in helping with vehicle search and marketplace recommendations. What type of car are you looking for?");

        Http::assertNothingSent();
    }

    public function test_get_ai_search_returns_friendly_endpoint_guidance(): void
    {
        $response = $this->getJson('/api/ai/search');

        $response->assertOk()
            ->assertJsonPath('expected_method', 'POST')
            ->assertJsonPath('example_payload.query', 'reliable Toyota daily cars');
    }

    private function createCar(string $brand, string $model, array $overrides = []): Car
    {
        return Car::create(array_merge([
            'brand' => $brand,
            'model' => $model,
            'year' => 2024,
            'price' => 500000,
            'mileage' => 10000,
            'fuel_type' => 'Petrol',
            'transmission' => 'Automatic',
            'category' => 'SUV',
            'color' => 'Black',
            'description' => "{$brand} {$model}",
        ], $overrides));
    }
}
