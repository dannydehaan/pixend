<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Collection;
use App\Models\Environment;

class EnvironmentVariable extends Model
{
    use HasFactory;

    protected $fillable = [
        'environment_id',
        'collection_id',
        'key',
        'encrypted_value',
        'sensitive',
        'description',
    ];

    protected $casts = [
        'sensitive' => 'boolean',
        'encrypted_value' => 'encrypted',
    ];

    public function environment(): BelongsTo
    {
        return $this->belongsTo(Environment::class);
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }
}
