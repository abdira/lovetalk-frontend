<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Counselor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'license_number',
        'specialization',
        'years_experience',
        'education',
        'approach',
        'hourly_rate',
        'available_days',
        'available_from',
        'available_to',
        'timezone',
        'is_verified',
        'is_available',
        'rating',
        'total_sessions',
    ];

    protected $casts = [
        'available_days' => 'array',
        'hourly_rate' => 'decimal:2',
        'is_verified' => 'boolean',
        'is_available' => 'boolean',
        'rating' => 'decimal:2',
        'available_from' => 'datetime:H:i',
        'available_to' => 'datetime:H:i',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function sessions()
    {
        return $this->hasMany(Session::class, 'counselor_id', 'user_id');
    }

    public function feedback()
    {
        return $this->hasMany(Feedback::class, 'counselor_id', 'user_id');
    }

    public function availabilities()
    {
        return $this->hasMany(CounselorAvailability::class, 'counselor_id', 'user_id');
    }

    // Scopes
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeWithRating($query, $minRating = 0)
    {
        return $query->where('rating', '>=', $minRating);
    }

    // Helper methods
    public function updateRating()
    {
        $averageRating = $this->feedback()->avg('rating');
        $this->update(['rating' => round($averageRating, 2)]);
    }

    public function incrementSessionCount()
    {
        $this->increment('total_sessions');
    }
}

