<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Car;
use App\Models\Offer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OfferController extends Controller
{
    private const MIN_PROMO_DISCOUNT_PERCENT = 3;
    private const MAX_PROMO_DISCOUNT_PERCENT = 18;

    /**
     * Return public, currently valid offers only.
     */
    public function index()
    {
        return response()->json(
            Offer::with('car')
                ->currentlyActive()
                ->latest()
                ->get()
        );
    }

    /**
     * Return every offer for the admin management table.
     */
    public function adminIndex(Request $request)
    {
        if (!$this->canManageOffers($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(
            Offer::with('car')
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        if (!$this->canManageOffers($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $this->validateOffer($request);

        $car = Car::find($validated['car_id']);
        $this->applyPriceSnapshot($validated, $car);
        
        $validated['expires_at'] = $validated['end_date'];
        $validated['is_active'] = $request->has('is_active') ? filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) : true;
        $validated['is_premium'] = $request->has('is_premium') ? filter_var($request->is_premium, FILTER_VALIDATE_BOOLEAN) : false;

        // Image upload handling
        if ($request->hasFile('image')) {
            $destPath = public_path('offers');
            if (!file_exists($destPath)) {
                mkdir($destPath, 0777, true);
            }
            $file = $request->file('image');
            $extension = $file->getClientOriginalExtension();
            $fileName = 'offer_' . uniqid() . '.' . $extension;
            $file->move($destPath, $fileName);
            $validated['image'] = '/offers/' . $fileName;
        }

        $offer = Offer::create($validated);
        $this->syncCarPremiumFlag($request, $offer->car);

        return response()->json($offer->fresh('car'), 201);
    }

    public function update(Request $request, string $id)
    {
        if (!$this->canManageOffers($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $offer = Offer::find($id);

        if (!$offer) {
            return response()->json(['message' => 'Offer not found'], 404);
        }

        $validated = $this->validateOffer($request, true);

        $carId = $validated['car_id'] ?? $offer->car_id;
        $car = Car::find($carId);
        $this->applyPriceSnapshot($validated, $car, $offer);

        if (isset($validated['end_date'])) {
            $validated['expires_at'] = $validated['end_date'];
        }
        if ($request->has('is_active')) {
            $validated['is_active'] = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('is_premium')) {
            $validated['is_premium'] = filter_var($request->is_premium, FILTER_VALIDATE_BOOLEAN);
        }

        // Image upload handling
        if ($request->hasFile('image')) {
            $destPath = public_path('offers');
            if (!file_exists($destPath)) {
                mkdir($destPath, 0777, true);
            }
            $file = $request->file('image');
            $extension = $file->getClientOriginalExtension();
            $fileName = 'offer_' . uniqid() . '.' . $extension;
            $file->move($destPath, $fileName);
            $validated['image'] = '/offers/' . $fileName;
        }

        $offer->update($validated);
        $this->syncCarPremiumFlag($request, $offer->fresh('car')->car);

        return response()->json($offer->fresh('car'));
    }

    public function destroy(Request $request, string $id)
    {
        if (!$this->canManageOffers($request)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $offer = Offer::find($id);

        if (!$offer) {
            return response()->json(['message' => 'Offer not found'], 404);
        }

        $offer->delete();

        return response()->json(['message' => 'Offer deleted successfully']);
    }

    private function validateOffer(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'title' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'discount_price' => [$required, 'numeric', 'min:0'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'discount_type' => ['nullable', Rule::in(['percentage', 'fixed'])],
            'car_id' => [$required, 'exists:cars,id'],
            'is_active' => ['nullable'],
            'is_premium' => ['nullable'],
            'image' => ['nullable'],
            'start_date' => [$required, 'date'],
            'end_date' => [$required, 'date', 'after_or_equal:start_date'],
        ]);
    }

    private function applyPriceSnapshot(array &$validated, ?Car $car, ?Offer $offer = null): void
    {
        if (!$car) {
            return;
        }

        $originalPrice = (float) $car->price;
        $discountPrice = array_key_exists('discount_price', $validated)
            ? (float) $validated['discount_price']
            : (float) ($offer?->discount_price ?? $originalPrice);

        $discountPrice = min(max($discountPrice, 0), $originalPrice);
        $discountPercentage = $originalPrice > 0
            ? round((($originalPrice - $discountPrice) / $originalPrice) * 100, 2)
            : 0;

        if ($discountPercentage < self::MIN_PROMO_DISCOUNT_PERCENT || $discountPercentage > self::MAX_PROMO_DISCOUNT_PERCENT) {
            throw ValidationException::withMessages([
                'discount_price' => sprintf(
                    'Offer discounts should be between %d%% and %d%% for realistic market pricing.',
                    self::MIN_PROMO_DISCOUNT_PERCENT,
                    self::MAX_PROMO_DISCOUNT_PERCENT
                ),
            ]);
        }

        $validated['original_price'] = $originalPrice;
        $validated['discount_price'] = $discountPrice;
        $validated['discount_percentage'] = $discountPercentage;
        $validated['discount'] = $discountPercentage;
        $validated['discount_type'] = 'percentage';
    }

    private function syncCarPremiumFlag(Request $request, ?Car $car): void
    {
        if (!$car || !$request->has('is_premium')) {
            return;
        }

        $car->update([
            'is_premium' => filter_var($request->is_premium, FILTER_VALIDATE_BOOLEAN),
        ]);
    }

    protected function canManageOffers(Request $request)
    {
        return $request->user()->can('manage_offers');
    }
}
