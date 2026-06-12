<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            if (!Schema::hasColumn('cars', 'is_premium')) {
                $table->boolean('is_premium')->default(false);
            }

            if (!Schema::hasColumn('cars', 'is_featured')) {
                $table->boolean('is_featured')->default(false);
            }

            if (!Schema::hasColumn('cars', 'is_deal_of_day')) {
                $table->boolean('is_deal_of_day')->default(false);
            }

            if (!Schema::hasColumn('cars', 'promotion_end_date')) {
                $table->timestamp('promotion_end_date')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cars', function (Blueprint $table) {
            $columns = array_filter([
                Schema::hasColumn('cars', 'is_premium') ? 'is_premium' : null,
                Schema::hasColumn('cars', 'is_featured') ? 'is_featured' : null,
                Schema::hasColumn('cars', 'is_deal_of_day') ? 'is_deal_of_day' : null,
                Schema::hasColumn('cars', 'promotion_end_date') ? 'promotion_end_date' : null,
            ]);

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
