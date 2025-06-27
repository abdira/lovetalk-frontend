<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Session extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'counselor_id',
        'type',
        'status',
        'scheduled_at',
        'started_at',
        'ended_at',
        'duration_minutes',
        'amount',
        'client_notes',
        'counselor_notes',
        'jitsi_room_id',
        'chat_room_id',
        'session_metadata',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'amount' => 'decimal:2',
        'session_metadata' => 'array',
    ];

    // Boot method to generate room IDs
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($session) {
            if (!$session->jitsi_room_id) {
                $session->jitsi_room_id = 'lovetalk-' . Str::random(12);
            }
            if (!$session->chat_room_id) {
                $session->chat_room_id = 'chat-' . Str::random(12);
            }
        });
    }

    // Relationships
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class);
    }

    public function chatMessages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('scheduled_at', '>', now())->where('status', 'scheduled');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('client_id', $userId)->orWhere('counselor_id', $userId);
    }

    // Helper methods
    public function start()
    {
        $this->update([
            'status' => 'in_progress',
            'started_at' => now(),
        ]);
    }

    public function complete()
    {
        $duration = $this->started_at ? now()->diffInMinutes($this->started_at) : 0;

        $this->update([
            'status' => 'completed',
            'ended_at' => now(),
            'duration_minutes' => $duration,
        ]);
    }

    public function cancel($reason = null)
    {
        $this->update([
            'status' => 'cancelled',
            'session_metadata' => array_merge($this->session_metadata ?? [], [
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]),
        ]);
    }
}

