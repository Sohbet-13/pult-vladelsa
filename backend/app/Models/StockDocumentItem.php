<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockDocumentItem extends Model
{
    use HasFactory;
    public $timestamps = false;

    protected $fillable = ['document_id', 'product_id', 'quantity', 'unit_cost'];
}