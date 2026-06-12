<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_id',
        'sender_name',
        'sender_role',
        'body',
        'file_path',
        'file_type',
        'file_name',
    ];

    protected $appends = ['file_url'];

    public function getFileUrlAttribute()
    {
        if ($this->file_path) {
            return asset('storage/' . $this->file_path);
        }
        return null;
    }

    /** The conversation this message belongs to */
    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    /** The user who sent this message (null for guest senders) */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
