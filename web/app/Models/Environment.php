<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

use App\Models\Collection;
use App\Models\Variable;

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

    public function variables(): MorphMany
    {
        return $this->morphMany(Variable::class, 'variableable');
    }
}
