<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'title_key',
        'message',
        'read',
        'link'
    ];

    protected $casts = [
        'read' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
