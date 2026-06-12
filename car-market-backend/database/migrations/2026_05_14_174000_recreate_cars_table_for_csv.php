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
        // Disable foreign key constraints to safely drop the table
        Schema::disableForeignKeyConstraints();

        // Drop old table if exists
        Schema::dropIfExists('cars');

        // Create fresh cars table
        Schema::create('cars', function (Blueprint $table) {
            $table->id(); // IMPORTANT: Must be BIGINT UNSIGNED for Laravel foreign keys
            $table->string('brand', 100);
            $table->string('model', 255);
            $table->integer('year');
            $table->bigInteger('price');
            $table->bigInteger('mileage');
            $table->string('fuel_type', 50);
            $table->string('transmission', 50);
            $table->string('color', 100)->nullable();
            $table->string('category', 100)->nullable();
            $table->text('description')->nullable();
            $table->text('listing_url')->nullable();
            $table->string('main_image', 255)->nullable();
            $table->string('front_image', 255)->nullable();
            $table->string('side_image', 255)->nullable();
            $table->string('rear_image', 255)->nullable();
            $table->string('interior_image', 255)->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });

        // Re-enable foreign key constraints
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('cars');
        Schema::enableForeignKeyConstraints();
    }
};
