<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CollectionEndpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'collection_id',
        'name',
        'method',
        'route',
        'description',
        'category',
        'cache',
        'priority',
        'access',
    ];

    public function collection(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }
}
