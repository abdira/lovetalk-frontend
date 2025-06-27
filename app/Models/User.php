<?php
// Model 1: User Model
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'bio',
        'profile_picture',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function counselor()
    {
        return $this->hasOne(Counselor::class);
    }

    public function admin()
    {
        return $this->hasOne(Admin::class);
    }

    public function clientSessions()
    {
        return $this->hasMany(Session::class, 'client_id');
    }

    public function counselorSessions()
    {
        return $this->hasMany(Session::class, 'counselor_id');
    }

    public function allSessions()
    {
        return Session::where('client_id', $this->id)->orWhere('counselor_id', $this->id);
    }

    public function clientFeedback()
    {
        return $this->hasMany(Feedback::class, 'client_id');
    }

    public function counselorFeedback()
    {
        return $this->hasMany(Feedback::class, 'counselor_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(ChatMessage::class, 'sender_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'client_id');
    }

    // Scopes
    public function scopeClients($query)
    {
        return $query->where('role', 'client');
    }

    public function scopeCounselors($query)
    {
        return $query->where('role', 'counselor');
    }

    public function scopeAdmins($query)
    {
        return $query->where('role', 'admin');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Accessors & Mutators
    public function getFullNameAttribute()
    {
        return $this->name;
    }

    public function getProfilePictureUrlAttribute()
    {
        return $this->profile_picture 
            ? asset('storage/' . $this->profile_picture) 
            : asset('images/default-avatar.png');
    }

    // Helper methods
    public function isClient()
    {
        return $this->role === 'client';
    }

    public function isCounselor()
    {
        return $this->role === 'counselor';
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }
}

