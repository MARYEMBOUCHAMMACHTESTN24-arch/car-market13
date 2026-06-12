<?php

namespace Tests\Feature;

use App\Models\Car;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CarUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create the necessary permissions
        Permission::create(['name' => 'add cars', 'guard_name' => 'web']);
        Permission::create(['name' => 'edit cars', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage cars', 'guard_name' => 'web']);
    }

    public function test_store_car_with_string_booleans_and_images()
    {
        $user = User::factory()->create();
        $user->givePermissionTo(['add cars', 'manage cars']);
        
        $payload = [
            'brand' => 'TestBrand',
            'model' => 'TestModel',
            'price' => 150000,
            'year' => 2024,
            'is_premium' => '1',
            'is_featured' => '0',
            'deal_of_day' => '1',
            'main_image' => UploadedFile::fake()->create('cover.jpg', 100, 'image/jpeg'),
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cars', $payload);

        $response->assertStatus(201);
        $data = $response->json();

        $this->assertEquals('TestBrand', $data['brand']);
        $this->assertEquals('TestModel', $data['model']);
        $this->assertTrue($data['is_premium']);
        $this->assertFalse($data['is_featured']);
        $this->assertTrue($data['is_deal_of_day']);

        // Assert the image path was generated using the correct unique ID subdirectory format:
        // /car/TestBrand/TestModel/{id}/main_{uniqid}.jpg
        $carId = $data['id'];
        $this->assertStringStartsWith("/car/TestBrand/TestModel/{$carId}/main_", $data['main_image']);

        // Assert physical file exists and clean it up
        $filePath = public_path($data['main_image']);
        $this->assertFileExists($filePath);
        
        // Cleanup the created directories/files
        @unlink($filePath);
        @rmdir(dirname($filePath));
        @rmdir(dirname(dirname($filePath)));
    }

    public function test_update_car_with_string_booleans_and_images()
    {
        $user = User::factory()->create();
        $user->givePermissionTo(['edit cars', 'manage cars']);

        $car = Car::create([
            'brand' => 'TestUpdate',
            'model' => 'UpdateModel',
            'price' => 200000,
            'year' => 2023,
            'is_premium' => false,
            'is_featured' => true,
            'is_deal_of_day' => false,
        ]);

        // Simulating front-end FormData submission style using POST + _method = PUT
        $payload = [
            '_method' => 'PUT',
            'is_premium' => '1',
            'is_featured' => '1',
            'deal_of_day' => '0',
            'main_image' => UploadedFile::fake()->create('update.jpg', 100, 'image/jpeg'),
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/cars/{$car->id}", $payload);

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertTrue($data['is_premium']);
        $this->assertTrue($data['is_featured']);
        $this->assertFalse($data['is_deal_of_day']);

        // Assert image is placed in correct subdirectory with unique name
        $this->assertStringStartsWith("/car/TestUpdate/UpdateModel/{$car->id}/main_", $data['main_image']);

        // Assert physical file exists and clean it up
        $filePath = public_path($data['main_image']);
        $this->assertFileExists($filePath);

        // Cleanup
        @unlink($filePath);
        @rmdir(dirname($filePath));
        @rmdir(dirname(dirname($filePath)));
    }

    public function test_premium_endpoint_returns_only_premium_cars()
    {
        $premiumCar = Car::create([
            'brand' => 'Premium',
            'model' => 'Visible',
            'price' => 300000,
            'year' => 2025,
            'is_premium' => true,
        ]);

        Car::create([
            'brand' => 'Regular',
            'model' => 'Hidden',
            'price' => 100000,
            'year' => 2022,
            'is_premium' => false,
        ]);

        $response = $this->getJson('/api/cars/premium');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $premiumCar->id)
            ->assertJsonPath('0.is_premium', true);
    }

    public function test_admin_can_toggle_car_premium_flag()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit cars');

        $car = Car::create([
            'brand' => 'Toggle',
            'model' => 'Premium',
            'price' => 250000,
            'year' => 2024,
            'is_premium' => false,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/api/cars/{$car->id}/premium", ['is_premium' => true]);

        $response->assertOk()
            ->assertJsonPath('id', $car->id)
            ->assertJsonPath('is_premium', true);

        $this->assertTrue($car->fresh()->is_premium);
    }
}
