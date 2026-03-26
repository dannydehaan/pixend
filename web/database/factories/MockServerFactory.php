<?php

namespace Database\Factories;

use App\Models\MockServer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MockServer>
 */
class MockServerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->word().' mock',
            'port' => fake()->numberBetween(1024, 65535),
        ];
    }
}
