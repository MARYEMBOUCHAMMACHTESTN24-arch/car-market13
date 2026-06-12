<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'message_id',
        'user_id',
        'subject',
        'guest_name',
        'guest_email',
        'is_read',
        'last_message_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'last_message_at' => 'datetime',
    ];

    /** The originating message (contact form submission) */
    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    /** The registered user who started the conversation (null for guests) */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /** All chat messages in this thread, oldest first */
    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class)->orderBy('created_at', 'asc');
    }

    /** Latest chat message (for preview) */
    public function latestMessage()
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }
}
