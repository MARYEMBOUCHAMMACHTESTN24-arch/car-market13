<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Services\PriceValidatorService;

class CarController extends Controller
{
    private const MIN_PROMO_DISCOUNT_PERCENT = 3;
    private const MAX_PROMO_DISCOUNT_PERCENT = 18;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Car::query();

        // Brand filter from /cars?brand=BMW. Normalize common separators so shared links keep working.
        if ($request->filled('brand')) {
            $brand = trim((string) $request->brand);
            $normalizedBrand = preg_replace('/[^a-z0-9]/', '', strtolower($brand));

            $query->where(function ($q) use ($brand, $normalizedBrand) {
                $q->where('brand', $brand)
                    ->orWhereRaw(
                        "LOWER(REPLACE(REPLACE(REPLACE(brand, '-', ''), ' ', ''), '_', '')) = ?",
                        [$normalizedBrand]
                    );
            });
        }

        // Category / body-type filter
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Fuel type filter
        if ($request->filled('fuel_type')) {
            $query->where('fuel_type', $request->fuel_type);
        }

        // Transmission filter
        if ($request->filled('transmission')) {
            $query->where('transmission', $request->transmission);
        }

        // Price range filters
        if ($request->filled('min_price') && is_numeric($request->min_price)) {
            $query->where('price', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price') && is_numeric($request->max_price)) {
            $query->where('price', '<=', (float) $request->max_price);
        }

        // Full-text search across brand, model, category
        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('brand', 'like', "%{$term}%")
                  ->orWhere('model', 'like', "%{$term}%")
                  ->orWhere('category', 'like', "%{$term}%");
            });
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Display the full car list for admin promotion controls.
     */
    public function adminIndex(Request $request)
    {
        if (!$request->user()->can('view_cars') && !$request->user()->can('manage_cars')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(Car::latest()->get());
    }

    /**
     * Return featured cars for the homepage.
     * Priority: is_featured = true. Fallback: random mix of up to 8 cars.
     */
    public function featured()
    {
        $featured = Car::where('is_featured', true)->latest()->get();

        if ($featured->count() > 0) {
            return response()->json($featured->take(8)->values());
        }

        // Fallback: pick up to 8 cars spread across brands for visual diversity
        $cars = Car::inRandomOrder()->take(8)->get();
        return response()->json($cars->values());
    }

    /**
     * Display premium offers controlled by the admin panel.
     */
    public function premium()
    {
        return response()->json(
            Car::where('is_premium', true)
                ->latest()
                ->get()
        );
    }

    /**
     * Toggle premium placement from the admin promotions panel.
     */
    public function togglePremium(Request $request, string $id)
    {
        if (!$request->user()->can('manage_cars')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'is_premium' => 'required|boolean',
        ]);

        $car = Car::find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        $car->update([
            'is_premium' => filter_var($validated['is_premium'], FILTER_VALIDATE_BOOLEAN),
        ]);

        return response()->json($car->fresh());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Incoming Car Store Request:', $request->all());
        Log::info('Files in Request:', $request->allFiles());

        if (!$request->user()->can('manage_cars')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'brand' => 'required|string',
            'model' => 'required|string',
            'price' => 'required|numeric|min:0',
            'year' => 'required|integer',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'mileage' => 'nullable|integer',
            'fuel_type' => 'nullable|string',
            'transmission' => 'nullable|string',
            'color' => 'nullable|string',
            'listing_url' => 'nullable|string',
            'main_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'side_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'rear_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'interior_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'is_premium' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'is_deal_of_day' => 'nullable|boolean',
            'deal_of_day' => 'nullable|boolean',
            'promotion_end_date' => 'nullable|date',
        ]);
        $this->normalizeTextFields($validated, [
            'brand',
            'model',
            'category',
            'fuel_type',
            'transmission',
            'color',
        ]);
        $this->normalizePromotionFields($validated);

        // Convert string booleans from FormData
        $validated['is_premium'] = $request->has('is_premium') ? filter_var($request->is_premium, FILTER_VALIDATE_BOOLEAN) : false;
        $validated['is_featured'] = $request->has('is_featured') ? filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN) : false;
        if ($request->has('deal_of_day')) {
            $validated['is_deal_of_day'] = filter_var($request->deal_of_day, FILTER_VALIDATE_BOOLEAN);
        } else {
            $validated['is_deal_of_day'] = $request->has('is_deal_of_day') ? filter_var($request->is_deal_of_day, FILTER_VALIDATE_BOOLEAN) : false;
        }

        $this->syncCategoryFields($validated);

        // Create the car record first so we have an ID for the per-car folder
        $priceValidation = app(PriceValidatorService::class)->validateAndCorrectPrice(
            $validated['brand'],
            $validated['model'],
            $validated['year'],
            $validated['mileage'] ?? 0,
            $validated['category'] ?? null,
            (float) $validated['price']
        );

        if ($priceValidation['is_suspicious']) {
            return response()->json([
                'message' => 'The given data was invalid.',
                'errors' => [
                    'price' => [
                        sprintf(
                            "The price is suspicious for a %s %s (%s). Expected range is %s DH to %s DH.",
                            $validated['year'],
                            $validated['brand'],
                            $validated['model'],
                            number_format($priceValidation['expected_min']),
                            number_format($priceValidation['expected_max'])
                        )
                    ]
                ]
            ], 422);
        }

        $car = Car::create($validated);

        // Handle image uploads – store inside /car/{brand}/{model}/{id}/ to prevent
        // cross-car collisions when two cars share the same brand + model name.
        $imageFields = ['main_image', 'front_image', 'side_image', 'rear_image', 'interior_image'];
        $imageUpdates = [];
        foreach ($imageFields as $field) {
            if ($request->hasFile($field)) {
                $brand     = $car->brand;
                $model     = str_replace(' ', '_', $car->model);
                $destPath  = public_path('car/' . $brand . '/' . $model . '/' . $car->id);
                if (!file_exists($destPath)) {
                    mkdir($destPath, 0777, true);
                }
                $file       = $request->file($field);
                $extension  = $file->getClientOriginalExtension();
                $fieldLabel = str_replace('_image', '', $field);
                $fileName   = $fieldLabel . '_' . uniqid() . '.' . $extension;
                $file->move($destPath, $fileName);
                $imageUpdates[$field] = '/car/' . $brand . '/' . $model . '/' . $car->id . '/' . $fileName;
            }
        }

        if (!empty($imageUpdates)) {
            $car->update($imageUpdates);
        }

        return response()->json($car->fresh(), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $car = Car::find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        return response()->json($car);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        if (!$request->user()->can('manage_cars')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $car = Car::find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        $validated = $request->validate([
            'brand' => 'sometimes|string',
            'model' => 'sometimes|string',
            'price' => 'sometimes|numeric|min:0',
            'year' => 'sometimes|integer',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'mileage' => 'nullable|integer',
            'fuel_type' => 'nullable|string',
            'transmission' => 'nullable|string',
            'color' => 'nullable|string',
            'listing_url' => 'nullable|string',
            'main_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'front_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'side_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'rear_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'interior_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'old_price' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'is_premium' => 'nullable|boolean',
            'is_featured' => 'nullable|boolean',
            'is_deal_of_day' => 'nullable|boolean',
            'deal_of_day' => 'nullable|boolean',
            'promotion_end_date' => 'nullable|date',
        ]);
        $this->normalizeTextFields($validated, [
            'brand',
            'model',
            'category',
            'fuel_type',
            'transmission',
            'color',
        ]);
        $this->normalizePromotionFields($validated, $car);

        if ($request->has('is_premium')) $validated['is_premium'] = filter_var($request->is_premium, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('is_featured')) $validated['is_featured'] = filter_var($request->is_featured, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('deal_of_day')) {
            $validated['is_deal_of_day'] = filter_var($request->deal_of_day, FILTER_VALIDATE_BOOLEAN);
        } elseif ($request->has('is_deal_of_day')) {
            $validated['is_deal_of_day'] = filter_var($request->is_deal_of_day, FILTER_VALIDATE_BOOLEAN);
        }

        $this->syncCategoryFields($validated);

        // Handle image uploads – store inside /car/{brand}/{model}/{id}/ to prevent
        // cross-car collisions when two cars share the same brand + model name.
        // Use a unique filename (never the original) so re-uploading doesn't clobber siblings.
        $imageFields = ['main_image', 'front_image', 'side_image', 'rear_image', 'interior_image'];
        foreach ($imageFields as $field) {
            if ($request->hasFile($field)) {
                $brand     = $validated['brand'] ?? $car->brand;
                $model     = str_replace(' ', '_', $validated['model'] ?? $car->model);
                $destPath  = public_path('car/' . $brand . '/' . $model . '/' . $car->id);
                if (!file_exists($destPath)) {
                    mkdir($destPath, 0777, true);
                }
                $file       = $request->file($field);
                $extension  = $file->getClientOriginalExtension();
                $fieldLabel = str_replace('_image', '', $field);
                $fileName   = $fieldLabel . '_' . uniqid() . '.' . $extension;
                $file->move($destPath, $fileName);
                $validated[$field] = '/car/' . $brand . '/' . $model . '/' . $car->id . '/' . $fileName;
            }
        }

        if (isset($validated['price']) && isset($validated['brand']) && isset($validated['model']) && isset($validated['year'])) {
            $priceValidation = app(PriceValidatorService::class)->validateAndCorrectPrice(
                $validated['brand'],
                $validated['model'],
                $validated['year'],
                $validated['mileage'] ?? $car->mileage,
                $validated['category'] ?? $car->category,
                (float) $validated['price']
            );

            if ($priceValidation['is_suspicious']) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => [
                        'price' => [
                            sprintf(
                                "The price is suspicious for a %s %s (%s). Expected range is %s DH to %s DH.",
                                $validated['year'],
                                $validated['brand'],
                                $validated['model'],
                                number_format($priceValidation['expected_min']),
                                number_format($priceValidation['expected_max'])
                            )
                        ]
                    ]
                ], 422);
            }
        }

        $car->update($validated);

        // Return fresh model so image_url and all appended attributes are re-computed
        return response()->json($car->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id)
    {
        if (!$request->user()->can('manage_cars')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $car = Car::find($id);

        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }

        // Optional: delete files from storage here if you want to clean up

        $car->delete();
        return response()->json(['message' => 'Car deleted successfully']);
    }
    /**
     * Get list of unique brands for filtering.
     */
    public function brands()
    {
        $brands = Car::select('brand')->distinct()->whereNotNull('brand')->orderBy('brand')->pluck('brand');
        return response()->json($brands);
    }

    /**
     * Get list of unique categories for filtering.
     */
    public function categories()
    {
        $categories = Car::select('category')->distinct()->whereNotNull('category')->orderBy('category')->pluck('category');
        return response()->json($categories);
    }

    /**
     * Get list of unique cities for filtering.
     */
    public function cities()
    {
        return response()->json([]);
    }

    private function syncCategoryFields(array &$data): void
    {
        if (empty($data['category'])) {
            return;
        }

        $category = Category::firstOrCreate(
            ['slug' => Str::slug($data['category'])],
            ['name' => $data['category']]
        );

        $data['category_id'] = $category->id;
    }

    private function normalizeTextFields(array &$data, array $fields): void
    {
        foreach ($fields as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === null) {
                continue;
            }

            $value = trim(preg_replace('/\s+/u', ' ', (string) $data[$field]));
            $data[$field] = $value === '' ? null : $value;
        }
    }

    private function normalizePromotionFields(array &$data, ?Car $existingCar = null): void
    {
        $price = array_key_exists('price', $data)
            ? (float) $data['price']
            : (float) ($existingCar?->price ?? 0);

        if ($price <= 0) {
            $data['old_price'] = null;
            $data['discount_percentage'] = null;
            return;
        }

        $hasOldPrice = array_key_exists('old_price', $data) && $data['old_price'] !== null && $data['old_price'] !== '';
        $hasDiscount = array_key_exists('discount_percentage', $data) && $data['discount_percentage'] !== null && $data['discount_percentage'] !== '';

        if (!$hasOldPrice && !$hasDiscount) {
            return;
        }

        $oldPrice = $hasOldPrice ? (float) $data['old_price'] : 0.0;
        $discount = $hasDiscount ? (float) $data['discount_percentage'] : 0.0;

        if (!$hasOldPrice && $discount > 0) {
            $oldPrice = round($price / (1 - ($discount / 100)));
        }

        if ($hasOldPrice) {
            if ($oldPrice <= $price) {
                throw ValidationException::withMessages([
                    'old_price' => 'Original price must be higher than the current price for a promotion.',
                ]);
            }

            $discount = round((($oldPrice - $price) / $oldPrice) * 100, 2);
        }

        if ($discount <= 0) {
            $data['old_price'] = null;
            $data['discount_percentage'] = null;
            return;
        }

        if ($discount < self::MIN_PROMO_DISCOUNT_PERCENT || $discount > self::MAX_PROMO_DISCOUNT_PERCENT) {
            throw ValidationException::withMessages([
                'discount_percentage' => sprintf(
                    'Vehicle promotional discounts should be between %d%% and %d%% for realistic demo pricing.',
                    self::MIN_PROMO_DISCOUNT_PERCENT,
                    self::MAX_PROMO_DISCOUNT_PERCENT
                ),
            ]);
        }

        $data['old_price'] = round($oldPrice);
        $data['discount_percentage'] = $discount;
    }
}
