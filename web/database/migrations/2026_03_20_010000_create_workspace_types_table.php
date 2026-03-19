<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workspace_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('sync_enabled')->default(false);
            $table->boolean('requires_organization')->default(false);
            $table->timestamps();
        });

        DB::table('workspace_types')->insert([
            [
                'slug' => 'local',
                'name' => 'Local Workspace',
                'description' => 'Local workspace that keeps data on this device without syncing.',
                'sync_enabled' => false,
                'requires_organization' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'company',
                'name' => 'Company Workspace',
                'description' => 'Synced workspace owned by an organization for shared teams.',
                'sync_enabled' => true,
                'requires_organization' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'premium_personal',
                'name' => 'Premium Personal Workspace',
                'description' => 'Synced personal workspace reserved for premium subscribers.',
                'sync_enabled' => true,
                'requires_organization' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('workspace_types');
    }
};
