<?php

namespace App\Models;

use Database\Factories\MockServerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MockServer extends Model
{
    /** @use HasFactory<MockServerFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'port',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
