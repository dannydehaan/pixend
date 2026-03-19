<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

class CollectionFactory extends Factory
{
    protected $model = Collection::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => 'Project Alpha API',
            'slug' => 'project-alpha',
            'description' => 'Core orchestration endpoints for the Project Alpha infrastructure.',
            'version' => 'v1.0.4',
            'status' => 'operational',
            'access_level' => 'public',
            'endpoint_count' => 14,
            'last_synced_at' => now()->subMinutes(5),
        ];
    }
}
