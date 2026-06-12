<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Additive migration — adds admin, SEO, and future-ready columns to v2_cars.
 * Uses addColumn (never dropColumn in up()) so legacy data is always safe.
 *
 * ROLLBACK SAFETY: down() only drops the columns added here.
 * Legacy tables are never touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('v2_cars', function (Blueprint $table) {
            // Admin / moderation fields
            if (!Schema::hasColumn('v2_cars', 'status')) {
                $table->string('status', 20)->default('active')->after('source_name');
                // status values: active | draft | archived | sold
            }
            if (!Schema::hasColumn('v2_cars', 'is_premium')) {
                $table->boolean('is_premium')->default(false)->after('is_sold');
            }
            if (!Schema::hasColumn('v2_cars', 'is_verified')) {
                $table->boolean('is_verified')->default(false)->after('is_premium');
            }
            if (!Schema::hasColumn('v2_cars', 'moderation_note')) {
                $table->text('moderation_note')->nullable()->after('is_verified');
            }
            if (!Schema::hasColumn('v2_cars', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('updated_at');
            }

            // SEO fields
            if (!Schema::hasColumn('v2_cars', 'meta_title')) {
                $table->string('meta_title', 160)->nullable()->after('favorites_count');
            }
            if (!Schema::hasColumn('v2_cars', 'meta_description')) {
                $table->text('meta_description')->nullable()->after('meta_title');
            }
        });

        // Add future-ready columns to v2_car_specs (non-destructive additions)
        Schema::table('v2_car_specs', function (Blueprint $table) {
            if (!Schema::hasColumn('v2_car_specs', 'weight')) {
                $table->string('weight', 50)->nullable()->after('seats');
            }
            if (!Schema::hasColumn('v2_car_specs', 'fuel_economy')) {
                $table->string('fuel_economy', 50)->nullable()->after('weight');
            }
            if (!Schema::hasColumn('v2_car_specs', 'emissions')) {
                $table->string('emissions', 50)->nullable()->after('fuel_economy');
            }
        });

        // Add alt_text column to v2_car_images
        Schema::table('v2_car_images', function (Blueprint $table) {
            if (!Schema::hasColumn('v2_car_images', 'alt_text')) {
                $table->string('alt_text')->nullable()->after('image_url');
            }
        });

        // Add logo_url to v2_brands
        Schema::table('v2_brands', function (Blueprint $table) {
            if (!Schema::hasColumn('v2_brands', 'logo_url')) {
                $table->string('logo_url')->nullable()->after('slug');
            }
        });

        // Add description to v2_categories
        Schema::table('v2_categories', function (Blueprint $table) {
            if (!Schema::hasColumn('v2_categories', 'description')) {
                $table->string('description')->nullable()->after('slug');
            }
        });

        // Add performance indexes on v2_cars
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_v2_cars_brand_id ON v2_cars (brand_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_v2_cars_category_id ON v2_cars (category_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_v2_cars_status ON v2_cars (status)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_v2_cars_is_featured ON v2_cars (is_featured)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_v2_cars_created_at ON v2_cars (created_at)');
        } catch (\Exception $e) {
            // MySQL uses different index check syntax — use addIndex fallback
            Schema::table('v2_cars', function (Blueprint $table) {
                try { $table->index('brand_id', 'idx_v2_cars_brand_id'); } catch (\Exception) {}
                try { $table->index('category_id', 'idx_v2_cars_category_id'); } catch (\Exception) {}
                try { $table->index('status', 'idx_v2_cars_status'); } catch (\Exception) {}
                try { $table->index('is_featured', 'idx_v2_cars_is_featured'); } catch (\Exception) {}
                try { $table->index('created_at', 'idx_v2_cars_created_at'); } catch (\Exception) {}
            });
        }

        // Auto-populate SEO meta fields from existing data
        DB::table('v2_cars')
            ->join('v2_brands', 'v2_brands.id', '=', 'v2_cars.brand_id')
            ->whereNull('v2_cars.meta_title')
            ->orderBy('v2_cars.id')
            ->each(function ($car) {
                $metaTitle = substr("{$car->name} {$car->title} — AutoMarket", 0, 160);
                $metaDesc  = substr("Explore the {$car->title} at AutoMarket. Premium vehicle, verified listing.", 0, 300);
                DB::table('v2_cars')->where('id', $car->id)->update([
                    'meta_title'       => $metaTitle,
                    'meta_description' => $metaDesc,
                    'published_at'     => $car->created_at,
                ]);
            });
    }

    public function down(): void
    {
        // Safe rollback — only drops columns added by this migration
        Schema::table('v2_cars', function (Blueprint $table) {
            $table->dropColumn([
                'status', 'is_premium', 'is_verified', 'moderation_note',
                'published_at', 'meta_title', 'meta_description',
            ]);
        });

        Schema::table('v2_car_specs', function (Blueprint $table) {
            $table->dropColumn(['weight', 'fuel_economy', 'emissions']);
        });

        Schema::table('v2_car_images', function (Blueprint $table) {
            $table->dropColumn('alt_text');
        });

        Schema::table('v2_brands', function (Blueprint $table) {
            $table->dropColumn('logo_url');
        });

        Schema::table('v2_categories', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
