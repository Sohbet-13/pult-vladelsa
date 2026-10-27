<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'currency',
        'timezone',
        'status',
    ];

    public function members()
    {
        return $this->hasMany(OrganizationMember::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'organization_members')
            ->withPivot('role', 'status')
            ->withTimestamps();
    }
}