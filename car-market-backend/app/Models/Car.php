<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Car extends Model
{
    protected $fillable = [
        'brand',
        'model',
        'year',
        'price',
        'mileage',
        'fuel_type',
        'transmission',
        'color',
        'category',
        'category_id',
        'description',
        'listing_url',
        'main_image',
        'front_image',
        'side_image',
        'rear_image',
        'interior_image',
        'old_price',
        'discount_percentage',
        'is_premium',
        'is_featured',
        'is_deal_of_day',
        'promotion_end_date'
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'is_premium' => 'boolean',
        'is_featured' => 'boolean',
        'is_deal_of_day' => 'boolean',
    ];

    /**
     * Returns a usable URL for the main image.
     * DB stores local paths under "/car1/..." or legacy paths that are normalized here.
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->main_image) {
            return null;
        }

        $path = trim($this->main_image);

        if (preg_match('#^https?://#i', $path)) {
            $urlPath = parse_url($path, PHP_URL_PATH) ?: '';

            if (
                str_starts_with($urlPath, '/car1/')
                || str_starts_with($urlPath, '/car/')
                || str_starts_with($urlPath, '/cars/')
                || str_starts_with($urlPath, '/cars1/')
            ) {
                $path = $urlPath;
            } elseif (str_starts_with($urlPath, '/storage/')) {
                return $urlPath;
            } else {
                return $path;
            }
        }

        if (str_starts_with($path, '/car1/')) {
            return $path;
        }

        if (str_starts_with($path, 'car1/')) {
            return '/' . $path;
        }

        if (str_starts_with($path, '/car/')) {
            return '/car1/' . substr($path, 5);
        }

        if (str_starts_with($path, 'car/')) {
            return '/car1/' . substr($path, 4);
        }

        if (str_starts_with($path, '/cars/')) {
            return '/car1/' . substr($path, 6);
        }

        if (str_starts_with($path, 'cars/')) {
            return '/car1/' . substr($path, 5);
        }

        if (str_starts_with($path, '/cars1/')) {
            return '/car1/' . substr($path, 7);
        }

        if (str_starts_with($path, 'cars1/')) {
            return '/car1/' . substr($path, 6);
        }

        return str_starts_with($path, '/') ? $path : '/' . $path;
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function factures()
    {
        return $this->hasMany(Facture::class, 'vehicle_id');
    }

    public function offers()
    {
        return $this->hasMany(Offer::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function favoritedBy()
    {
        return $this->belongsToMany(User::class, 'favorites')->withPivot('created_at');
    }
}
