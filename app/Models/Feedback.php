<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $table = 'feedback';

    protected $fillable = [
        'session_id',
        'client_id',
        'counselor_id',
        'rating',
        'client_feedback',
        'counselor_feedback',
        'would_recommend',
        'rating_categories',
        'is_anonymous',
    ];

    protected $casts = [
        'would_recommend' => 'boolean',
        'rating_categories' => 'array',
        'is_anonymous' => 'boolean',
    ];

    // Relationships
    public function session()
    {
        return $this->belongsTo(Session::class);
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function counselor()
    {
        return $this->belongsTo(User::class, 'counselor_id');
    }

    // Scopes
    public function scopePositive($query)
    {
        return $query->where('rating', '>=', 4);
    }

    public function scopeRecommended($query)
    {
        return $query->where('would_recommend', true);
    }
}

