<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Variable extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'encrypted_value',
    ];

    protected $hidden = [
        'encrypted_value',
    ];

    protected $casts = [
        'encrypted_value' => 'encrypted',
    ];

    public function variableable(): MorphTo
    {
        return $this->morphTo();
    }
}
