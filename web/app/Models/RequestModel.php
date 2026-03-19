<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RequestModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'encrypted_payload',
    ];

    protected $casts = [
        'encrypted_payload' => 'array',
    ];
}
