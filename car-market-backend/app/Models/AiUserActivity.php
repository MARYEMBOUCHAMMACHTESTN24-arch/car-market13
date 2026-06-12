<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUserActivity extends Model
{
    protected $fillable = [
        'user_id',
        'session_id',
        'car_id',
        'event_type',
        'query',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function car()
    {
        return $this->belongsTo(Car::class);
    }
}
