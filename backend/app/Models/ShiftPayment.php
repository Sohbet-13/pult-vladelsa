<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftPayment extends Model
{
    use HasFactory;
    public $timestamps = false;

    protected $fillable = [
        'shift_id', 'payment_method', 'expected_amount', 'actual_amount', 'difference_amount'
    ];
}