<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'organization_id', 'sku', 'name', 'category_id', 'unit_id', 'minimum_stock', 'status'
    ];

    public function category()
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function balances()
    {
        return $this->hasMany(StockBalance::class);
    }
}