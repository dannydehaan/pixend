<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public const DEFAULT_TYPES = [
        ['slug' => 'standard', 'name' => 'Standard Workspace', 'description' => 'Default working area for collections and environments.'],
        ['slug' => 'sandbox', 'name' => 'Sandbox', 'description' => 'Disposable workspace for trying new flows before sharing.'],
        ['slug' => 'team', 'name' => 'Team Workspace', 'description' => 'Shared workspace for a team with tighter controls.'],
    ];

    public function up(): void
    {
        Schema::create('workspace_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        foreach (self::DEFAULT_TYPES as $type) {
            DB::table('workspace_types')->insert(array_merge($type, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_types');
    }
};
