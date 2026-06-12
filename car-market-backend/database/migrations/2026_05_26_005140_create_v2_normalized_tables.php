<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Brands Table
        Schema::create('v2_brands', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        // 2. Create Categories Table
        Schema::create('v2_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->timestamps();
        });

        // 3. Create Cars Table
        Schema::create('v2_cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained('v2_brands')->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained('v2_categories')->onDelete('set null');
            $table->string('title');
            $table->string('slug')->unique();
            $table->integer('year');
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedBigInteger('mileage')->default(0);
            $table->string('fuel_type')->nullable();
            $table->string('transmission')->nullable();
            $table->string('color')->nullable();
            $table->text('description')->nullable();
            $table->text('source_url')->nullable();
            $table->string('source_name')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_sold')->default(false);
            $table->integer('views_count')->default(0);
            $table->integer('favorites_count')->default(0);
            $table->timestamps();
            
            // Indexes
            $table->index('price');
            $table->index('year');
            $table->index('fuel_type');
        });

        // 4. Create Car Images Table
        Schema::create('v2_car_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('v2_cars')->onDelete('cascade');
            $table->string('image_url');
            $table->string('image_type')->default('gallery'); // main, front, side, rear, interior, gallery
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // 5. Create Car Specs Table
        Schema::create('v2_car_specs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('car_id')->constrained('v2_cars')->onDelete('cascade');
            $table->string('engine')->nullable();
            $table->string('horsepower')->nullable();
            $table->string('torque')->nullable();
            $table->string('drivetrain')->nullable();
            $table->string('top_speed')->nullable();
            $table->string('acceleration')->nullable();
            $table->integer('doors')->nullable();
            $table->integer('seats')->nullable();
            $table->timestamps();
        });

        // ==========================================
        // DATA MIGRATION FROM OLD `cars` TABLE
        // ==========================================
        if (Schema::hasTable('cars')) {
            $oldCars = DB::table('cars')->get();

            // Cache mapping for brand/category names to IDs
            $brandMap = [];
            $categoryMap = [];

            foreach ($oldCars as $car) {
                // Handle Brand
                $brandName = trim($car->brand ?? 'Unknown');
                if (!isset($brandMap[$brandName])) {
                    $brandId = DB::table('v2_brands')->insertGetId([
                        'name' => $brandName,
                        'slug' => Str::slug($brandName),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $brandMap[$brandName] = $brandId;
                }

                // Handle Category
                $categoryId = null;
                if (!empty($car->category)) {
                    $categoryName = trim($car->category);
                    if (!isset($categoryMap[$categoryName])) {
                        $newCatId = DB::table('v2_categories')->insertGetId([
                            'name' => $categoryName,
                            'slug' => Str::slug($categoryName),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        $categoryMap[$categoryName] = $newCatId;
                    }
                    $categoryId = $categoryMap[$categoryName];
                }

                // Generate slug
                $title = trim(($car->brand ?? '') . ' ' . ($car->model ?? ''));
                if (empty($title)) {
                    $title = 'Car ' . $car->id;
                }
                $slug = Str::slug($title . '-' . $car->id);

                // Insert into v2_cars
                $newCarId = DB::table('v2_cars')->insertGetId([
                    'id' => $car->id, // Maintain ID for relationships
                    'brand_id' => $brandMap[$brandName],
                    'category_id' => $categoryId,
                    'title' => $title,
                    'slug' => $slug,
                    'year' => $car->year ?? 2024,
                    'price' => $car->price ?? 0,
                    'mileage' => $car->mileage ?? 0,
                    'fuel_type' => $car->fuel_type ?? null,
                    'transmission' => $car->transmission ?? null,
                    'color' => $car->color ?? null,
                    'description' => $car->description ?? null,
                    'source_url' => $car->listing_url ?? null,
                    'source_name' => str_contains($car->listing_url ?? '', 'bringatrailer') ? 'Bring a Trailer' : null,
                    'is_featured' => $car->is_premium ?? 0, // Fallback mapping
                    'created_at' => $car->created_at ?? now(),
                    'updated_at' => $car->updated_at ?? now(),
                ]);

                // Copy Images
                $images = [
                    'main' => $car->main_image ?? null,
                    'front' => $car->front_image ?? null,
                    'side' => $car->side_image ?? null,
                    'rear' => $car->rear_image ?? null,
                    'interior' => $car->interior_image ?? null,
                ];

                $sortOrder = 0;
                foreach ($images as $type => $url) {
                    if (!empty($url)) {
                        DB::table('v2_car_images')->insert([
                            'car_id' => $newCarId,
                            'image_url' => $url,
                            'image_type' => $type,
                            'sort_order' => $sortOrder++,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('v2_car_specs');
        Schema::dropIfExists('v2_car_images');
        Schema::dropIfExists('v2_cars');
        Schema::dropIfExists('v2_categories');
        Schema::dropIfExists('v2_brands');
    }
};
