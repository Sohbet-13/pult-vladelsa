<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockBalance extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $primaryKey = null;
    public $incrementing = false;

    protected $fillable = ['organization_id', 'location_id', 'product_id', 'quantity'];
}