<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'is_read',
        'reply',
        'status',
        'user_id',
        'conversation_id',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** The conversation thread that originated from this contact message */
    public function conversation()
    {
        return $this->hasOne(Conversation::class);
    }
}
