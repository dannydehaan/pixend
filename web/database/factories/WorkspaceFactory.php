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

        $type = WorkspaceType::firstWhere('slug', WorkspaceType::STANDARD);
        if (! $type) {
            $type = WorkspaceType::create([
                'slug' => WorkspaceType::STANDARD,
                'name' => 'Standard Workspace',
                'description' => 'Default workspace type',
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
