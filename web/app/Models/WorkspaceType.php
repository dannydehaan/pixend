<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkspaceType extends Model
{
    use HasFactory;

    public const LOCAL = 'local';
    public const COMPANY = 'company';
    public const PREMIUM = 'premium';

    protected $fillable = [
        'slug',
        'name',
        'description',
        'sync_enabled',
        'requires_organization',
    ];

    protected $casts = [
        'sync_enabled' => 'boolean',
        'requires_organization' => 'boolean',
    ];

    public static function getDefaultType(): WorkspaceType
    {
            return static::firstWhere('slug', self::LOCAL);
    }

    public function workspaces(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Workspace::class);
    }
}
