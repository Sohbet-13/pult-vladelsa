<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;
    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'location_id', 'opened_by', 'closed_by', 
        'status', 'opened_at', 'closed_at', 'closing_note'
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function payments()
    {
        return $this->hasMany(ShiftPayment::class);
    }

    public function openedBy()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }
}