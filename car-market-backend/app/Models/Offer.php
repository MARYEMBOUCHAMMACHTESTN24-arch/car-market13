<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $fillable = [
        'title',
        'description',
        'discount',
        'discount_type',
        'discount_price',
        'discount_percentage',
        'original_price',
        'expires_at',
        'is_active',
        'is_premium',
        'image',
        'car_id',
        'start_date',
        'end_date',
    ];

    protected $appends = ['image_url'];

    protected $casts = [
        'discount' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'original_price' => 'decimal:2',
        'is_active' => 'boolean',
        'is_premium' => 'boolean',
        'expires_at' => 'datetime',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function getImageUrlAttribute(): ?string
    {
        if ($this->image) {
            $path = trim($this->image);
            if (preg_match('#^https?://#i', $path)) {
                return $path;
            }
            if (!str_starts_with($path, '/')) {
                $path = '/' . $path;
            }
            return $path;
        }

        return $this->car?->image_url;
    }

    public function car()
    {
        return $this->belongsTo(Car::class);
    }

    public function scopeCurrentlyActive(Builder $query): Builder
    {
        $now = now();

        return $query
            ->where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now);
    }
}
