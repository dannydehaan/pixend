<?php

declare(strict_types=1);

use App\Models\Workspace;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = $this->user->createToken('api-token')->plainTextToken;
});

it('requires authentication to list workspaces', function () {
    $this->getJson('/api/1.0/workspaces')->assertStatus(401);
});

it('allows an authenticated user to fetch their workspaces', function () {
    $workspace = Workspace::factory()->create();
    $workspace->users()->attach($this->user);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->getJson('/api/1.0/workspaces')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('creates a workspace and assigns the creator', function () {
    $payload = [
        'name' => 'Design Ops',
        'slug' => 'design-ops',
        'description' => 'Design team workspace',
    ];

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson('/api/1.0/workspaces', $payload)
        ->assertCreated()
        ->assertJsonPath('data.users.0.id', $this->user->id);

    $this->assertDatabaseHas('workspaces', ['slug' => 'design-ops']);
});

it('lets a user belong to multiple workspaces', function () {
    $workspace = Workspace::factory()->create();
    $workspace->users()->attach($this->user);

    $next = Workspace::factory()->create();
    $next->users()->attach($this->user);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->getJson('/api/1.0/workspaces')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('attaches another user to a workspace', function () {
    $workspace = Workspace::factory()->create();
    $workspace->users()->attach($this->user);

    $otherUser = User::factory()->create();

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson("/api/1.0/workspaces/{$workspace->id}/users", ['user_id' => $otherUser->id])
        ->assertOk()
        ->assertJsonCount(2, 'data.users');
});
