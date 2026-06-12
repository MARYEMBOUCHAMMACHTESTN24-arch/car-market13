<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'car_id',
        'name',
        'email',
        'phone',
        'status',
        'appointment_date',
        'appointment_time',
        'appointment_location',
        'appointment_note'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function car()
    {
        return $this->belongsTo(Car::class);
    }

    public function facture()
    {
        return $this->hasOne(Facture::class);
    }
}
