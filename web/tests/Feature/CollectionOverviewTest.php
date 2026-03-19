<?php

declare(strict_types=1);

use App\Models\Collection;
use App\Models\CollectionEndpoint;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = $this->user->createToken('api-token')->plainTextToken;
});

it('requires authentication to view the collection overview', function () {
    $this->getJson('/api/1.0/collections/overview')->assertStatus(401);
});

it('returns collection overview for the current user', function () {
    $collection = Collection::factory()->create();
    CollectionEndpoint::factory()->count(3)->create(['collection_id' => $collection->id]);
    $collection->workspace->users()->attach($this->user);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->getJson('/api/1.0/collections/overview')
        ->assertOk()
        ->assertJsonPath('data.hero.name', $collection->name)
        ->assertJsonCount(3, 'data.endpoints');
});
