<?php

namespace Database\Factories;

use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\WorkspaceType;

class WorkspaceFactory extends Factory
{
    protected $model = Workspace::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->company;

        $type = WorkspaceType::firstWhere('slug', WorkspaceType::LOCAL);
        if (! $type) {
            $type = WorkspaceType::create([
                'slug' => WorkspaceType::LOCAL,
                'name' => 'Local Workspace',
                'description' => 'Local workspace that keeps data on the device.',
                'sync_enabled' => false,
                'requires_organization' => false,
            ]);
        }

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . $this->faker->unique()->numberBetween(100, 999),
            'description' => $this->faker->sentence,
            'workspace_type_id' => $type->id,
        ];
    }
}
