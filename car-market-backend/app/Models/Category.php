<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'image', 'description', 'cover_image'];

    protected $appends = ['image_url'];

    /**
     * Cars that belong to this category.
     */
    public function cars()
    {
        return $this->hasMany(Car::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        $path = $this->image ?: $this->cover_image;

        if (!$path) {
            return null;
        }

        if (preg_match('#^https?://#i', $path)) {
            return $path;
        }

        return str_starts_with($path, '/') ? $path : '/' . $path;
    }
}
