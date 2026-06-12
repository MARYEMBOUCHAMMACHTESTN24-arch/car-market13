<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class OfferApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'manage cars', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'edit cars', 'guard_name' => 'web']);
    }

    public function test_public_offers_endpoint_returns_only_active_current_offers()
    {
        $car = $this->createCar('Active');
        $activeOffer = Offer::create([
            'car_id' => $car->id,
            'title' => 'Spring Sale',
            'description' => 'Valid promotion',
            'discount' => 15,
            'discount_type' => 'percentage',
            'is_active' => true,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
        ]);

        Offer::create([
            'car_id' => $this->createCar('Inactive')->id,
            'title' => 'Inactive Sale',
            'discount' => 25,
            'discount_type' => 'percentage',
            'is_active' => false,
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
        ]);

        Offer::create([
            'car_id' => $this->createCar('Expired')->id,
            'title' => 'Expired Sale',
            'discount' => 10000,
            'discount_type' => 'fixed',
            'is_active' => true,
            'start_date' => now()->subDays(5),
            'end_date' => now()->subDay(),
        ]);

        Offer::create([
            'car_id' => $this->createCar('Future')->id,
            'title' => 'Future Sale',
            'discount' => 10,
            'discount_type' => 'percentage',
            'is_active' => true,
            'start_date' => now()->addDay(),
            'end_date' => now()->addDays(5),
        ]);

        $response = $this->getJson('/api/offers');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $activeOffer->id)
            ->assertJsonPath('0.car.id', $car->id);
    }

    public function test_admin_can_create_update_and_delete_offer()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('manage cars');

        $car = $this->createCar('Managed');

        $createResponse = $this->actingAs($user, 'sanctum')->postJson('/api/offers', [
            'car_id' => $car->id,
            'title' => 'Launch Offer',
            'description' => 'Admin-created offer',
            'discount' => 20,
            'discount_type' => 'percentage',
            'is_active' => true,
            'is_premium' => true,
            'start_date' => now()->subHour()->toISOString(),
            'end_date' => now()->addDays(3)->toISOString(),
        ]);

        $createResponse->assertCreated()
            ->assertJsonPath('title', 'Launch Offer')
            ->assertJsonPath('car.id', $car->id);

        $offerId = $createResponse->json('id');
        $this->assertTrue($car->fresh()->is_premium);

        $updateResponse = $this->actingAs($user, 'sanctum')->putJson("/api/offers/{$offerId}", [
            'title' => 'Updated Offer',
            'discount' => 5000,
            'discount_type' => 'fixed',
            'is_active' => false,
            'start_date' => now()->subHour()->toISOString(),
            'end_date' => now()->addDays(4)->toISOString(),
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('title', 'Updated Offer')
            ->assertJsonPath('discount_type', 'fixed')
            ->assertJsonPath('is_active', false);

        $deleteResponse = $this->actingAs($user, 'sanctum')->deleteJson("/api/offers/{$offerId}");

        $deleteResponse->assertOk();
        $this->assertDatabaseMissing('offers', ['id' => $offerId]);
    }

    private function createCar(string $brand): Car
    {
        return Car::create([
            'brand' => $brand,
            'model' => 'Model',
            'price' => 250000,
            'year' => 2024,
        ]);
    }
}
