<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department',
        'permissions',
        'is_super_admin',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_super_admin' => 'boolean',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function hasPermission($permission)
    {
        return $this->is_super_admin || in_array($permission, $this->permissions ?? []);
    }
}

