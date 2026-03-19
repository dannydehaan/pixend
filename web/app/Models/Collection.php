<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'name',
        'slug',
        'description',
        'version',
        'status',
        'access_level',
        'endpoint_count',
        'last_synced_at',
    ];

    protected $casts = [
        'last_synced_at' => 'datetime',
    ];

    public function workspace(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function endpoints(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(CollectionEndpoint::class);
    }

    public function environments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Environment::class);
    }
}
