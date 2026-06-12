<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        if ($isSqlite) {
            Schema::dropIfExists('cars');
            Schema::create('cars', function (Blueprint $table) {
                $table->id();
                $table->string('brand', 100);
                $table->string('model', 255);
                $table->integer('year');
                $table->unsignedBigInteger('price')->default(0);
                $table->unsignedBigInteger('mileage')->default(0);
                $table->string('fuel_type', 50)->nullable();
                $table->string('transmission', 50)->nullable();
                $table->string('color', 100)->nullable();
                $table->string('category', 100)->nullable();
                $table->text('description')->nullable();
                $table->text('listing_url')->nullable();
                $table->string('main_image', 255)->nullable();
                $table->string('front_image', 255)->nullable();
                $table->string('side_image', 255)->nullable();
                $table->string('rear_image', 255)->nullable();
                $table->string('interior_image', 255)->nullable();
                $table->timestamps();
            });
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');
            Schema::dropIfExists('cars');

            DB::statement("
                CREATE TABLE cars (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    brand VARCHAR(100) NOT NULL,
                    model VARCHAR(255) NOT NULL,
                    year INT NOT NULL,
                    price BIGINT DEFAULT 0,
                    mileage BIGINT DEFAULT 0,
                    fuel_type VARCHAR(50),
                    transmission VARCHAR(50),
                    color VARCHAR(100),
                    category VARCHAR(100),
                    description TEXT,
                    listing_url TEXT,
                    main_image VARCHAR(255),
                    front_image VARCHAR(255),
                    side_image VARCHAR(255),
                    rear_image VARCHAR(255),
                    interior_image VARCHAR(255),
                    created_at TIMESTAMP NULL DEFAULT NULL,
                    updated_at TIMESTAMP NULL DEFAULT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            ");

            DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
