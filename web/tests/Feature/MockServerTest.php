<?php

declare(strict_types=1);

use App\Models\MockServer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = $this->user->createToken('api-token')->plainTextToken;
    $this->headers = ['Authorization' => "Bearer {$this->token}"];
});

it('requires authentication to list mock servers', function () {
    $this->getJson('/api/1.0/mock-servers')->assertStatus(401);
});

it('returns only the authenticated user mock servers', function () {
    MockServer::factory()->for($this->user)->create();
    $other = User::factory()->create(['is_premium' => true]);
    MockServer::factory()->for($other)->create();

    $this->withHeaders($this->headers)
        ->getJson('/api/1.0/mock-servers')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('allows premium users to create mock servers', function () {
    $this->user->update(['is_premium' => true]);

    $payload = ['name' => 'Local API', 'port' => 4010];

    $this->withHeaders($this->headers)
        ->postJson('/api/1.0/mock-servers', $payload)
        ->assertCreated()
        ->assertJsonPath('data.name', 'Local API');

    $this->assertDatabaseHas('mock_servers', [
        'user_id' => $this->user->id,
        'port' => 4010,
    ]);
});

it('prevents free users from creating mock servers', function () {
    $payload = ['name' => 'Local API', 'port' => 4010];

    $this->withHeaders($this->headers)
        ->postJson('/api/1.0/mock-servers', $payload)
        ->assertStatus(403);
});

it('enforces unique port per user', function () {
    $this->user->update(['is_premium' => true]);
    MockServer::factory()->for($this->user)->create(['port' => 4010]);

    $this->withHeaders($this->headers)
        ->postJson('/api/1.0/mock-servers', ['name' => 'Another', 'port' => 4010])
        ->assertStatus(422)
        ->assertJsonValidationErrors('port');
});

it('allows premium owners to update a mock server', function () {
    $this->user->update(['is_premium' => true]);
    $mockServer = MockServer::factory()->for($this->user)->create(['port' => 4010]);

    $this->withHeaders($this->headers)
        ->putJson("/api/1.0/mock-servers/{$mockServer->id}", ['name' => 'Renamed', 'port' => 4020])
        ->assertOk()
        ->assertJsonPath('data.port', 4020);
});

it('prevents other users from updating the mock server', function () {
    $this->user->update(['is_premium' => true]);
    $mockServer = MockServer::factory()->for($this->user)->create();

    $other = User::factory()->create(['is_premium' => true]);
    $token = $other->createToken('api-token')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->putJson("/api/1.0/mock-servers/{$mockServer->id}", ['name' => 'Renamed', 'port' => 5000])
        ->assertStatus(403);
});

it('allows premium owners to delete a mock server', function () {
    $this->user->update(['is_premium' => true]);
    $mockServer = MockServer::factory()->for($this->user)->create();

    $this->withHeaders($this->headers)
        ->deleteJson("/api/1.0/mock-servers/{$mockServer->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('mock_servers', ['id' => $mockServer->id]);
});

it('prevents free users from deleting mock servers', function () {
    $mockServer = MockServer::factory()->for($this->user)->create();

    $this->withHeaders($this->headers)
        ->deleteJson("/api/1.0/mock-servers/{$mockServer->id}")
        ->assertStatus(403);
});

it('prevents other users from deleting mock servers', function () {
    $this->user->update(['is_premium' => true]);
    $mockServer = MockServer::factory()->for($this->user)->create();

    $other = User::factory()->create(['is_premium' => true]);
    $token = $other->createToken('api-token')->plainTextToken;

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->deleteJson("/api/1.0/mock-servers/{$mockServer->id}")
        ->assertStatus(403);
});
