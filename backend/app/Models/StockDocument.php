<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockDocument extends Model
{
    use HasFactory;
    public $timestamps = false;

    protected $fillable = [
        'organization_id', 'location_id', 'type', 'status', 
        'reason_id', 'created_by', 'occurred_at'
    ];

    public function items()
    {
        return $this->hasMany(StockDocumentItem::class, 'document_id');
    }
}