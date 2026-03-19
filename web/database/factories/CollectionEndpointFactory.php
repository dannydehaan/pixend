<?php

namespace Database\Factories;

use App\Models\Collection;
use App\Models\CollectionEndpoint;
use Illuminate\Database\Eloquent\Factories\Factory;

class CollectionEndpointFactory extends Factory
{
    protected $model = CollectionEndpoint::class;

    public function definition(): array
    {
        return [
            'collection_id' => Collection::factory(),
            'name' => $this->faker->sentence(3),
            'method' => $this->faker->randomElement(['GET', 'POST', 'PATCH', 'DELETE']),
            'route' => '/v1/' . $this->faker->slug(),
            'description' => $this->faker->paragraph(),
            'category' => $this->faker->randomElement(['Core', 'Admin', 'Infra']),
            'cache' => '300s',
            'priority' => $this->faker->randomElement(['High', 'Normal']),
            'access' => 'Bearer',
        ];
    }
}
