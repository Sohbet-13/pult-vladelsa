<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationMember extends Model
{
    use HasFactory;

    // Отключаем стандартные timestamps, так как в таблице их нет
    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'user_id',
        'role',
        'status',
    ];

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}