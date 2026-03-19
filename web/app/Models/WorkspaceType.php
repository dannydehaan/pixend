<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkspaceType extends Model
{
    use HasFactory;

    public const STANDARD = 'standard';
    public const SANDBOX = 'sandbox';
    public const TEAM = 'team';

    protected $fillable = [
        'slug',
        'name',
        'description',
    ];

    public static function getDefaultType(): WorkspaceType
    {
        return static::firstWhere('slug', self::STANDARD);
    }

    public function workspaces(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Workspace::class);
    }
}
