<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Environment extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'name',
        'region',
        'description',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function collection(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }
}
