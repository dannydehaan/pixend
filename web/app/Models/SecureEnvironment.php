<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SecureEnvironment extends Model
{
    use HasFactory;

    protected $table = 'secure_environments';

    protected $fillable = [
        'name',
        'encrypted_variables',
    ];

    protected $casts = [
        'encrypted_variables' => 'array',
    ];
}
