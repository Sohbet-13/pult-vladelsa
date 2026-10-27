<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockReason extends Model
{
    use HasFactory;
    public $timestamps = false;
    
    protected $fillable = ['organization_id', 'type', 'name', 'requires_comment', 'status'];
}