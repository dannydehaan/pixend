<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\Environment;
use Illuminate\Database\Eloquent\Factories\Factory;

class EnvironmentFactory extends Factory
{
    protected $model = Environment::class;

    public function definition(): array
    {
        return [
            'collection_id' => Collection::factory(),
            'name' => $this->faker->word . ' Environment',
            'region' => $this->faker->randomElement(['us-east-1', 'eu-west-1', 'ap-southeast-2']),
            'description' => $this->faker->sentence(),
            'settings' => ['tier' => $this->faker->randomElement(['prod', 'staging'])],
        ];
    }
}
