<?php

declare(strict_types=1);

use App\Models\Collection;
use App\Models\Environment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->workspace = $this->user->workspaces()->create([
        'name' => 'Default Workspace',
        'slug' => 'default',
    ]);
    $this->token = $this->user->createToken('api-token')->plainTextToken;
});

it('allows authenticated users to create collections', function () {
    $workspace = $this->user->workspaces()->create([
        'name' => 'Alpha',
        'slug' => 'alpha',
    ]);

    $payload = [
        'name' => 'Project Beta',
        'workspace_id' => $workspace->id,
        'description' => 'Desc',
    ];

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson('/api/1.0/collections', $payload)
        ->assertCreated()
        ->assertJsonPath('data.name', 'Project Beta');

    expect(Collection::where('name', 'Project Beta')->exists())->toBeTrue();
});

it('validates name when creating collection', function () {
    $workspace = $this->user->workspaces()->create([
        'name' => 'Alpha',
        'slug' => 'alpha',
    ]);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson('/api/1.0/collections', [
            'workspace_id' => $workspace->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('name');
});

it('allows creating environments for accessible collections', function () {
    $workspace = $this->user->workspaces()->create([
        'name' => 'Alpha',
        'slug' => 'alpha',
    ]);

    $collection = $workspace->collections()->create([
        'name' => 'Project',
        'slug' => Str::slug('Project ' . uniqid()),
        'endpoint_count' => 0,
        'status' => 'draft',
        'access_level' => 'private',
    ]);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson('/api/1.0/environments', [
            'collection_id' => $collection->id,
            'name' => 'Staging',
            'region' => 'eu-west-1',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Staging');

    expect(Environment::where('name', 'Staging')->exists())->toBeTrue();
});

it('does not allow environment creation when user lacks access', function () {
    $otherUser = User::factory()->create();
    $workspace = $otherUser->workspaces()->create([
        'name' => 'Omega',
        'slug' => 'omega',
    ]);

    $collection = $workspace->collections()->create([
        'name' => 'External',
        'slug' => Str::slug('External ' . uniqid()),
        'endpoint_count' => 0,
        'status' => 'draft',
        'access_level' => 'private',
    ]);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson('/api/1.0/environments', [
            'collection_id' => $collection->id,
            'name' => 'Blocked',
        ])
        ->assertStatus(403);
});

it('validates name when creating environment', function () {
    $workspace = $this->user->workspaces()->create([
        'name' => 'Alpha',
        'slug' => 'alpha',
    ]);

    $collection = $workspace->collections()->create([
        'name' => 'Project',
        'slug' => Str::slug('Project ' . uniqid()),
        'endpoint_count' => 0,
        'status' => 'draft',
        'access_level' => 'private',
    ]);

    $this->withHeader('Authorization', "Bearer {$this->token}")
        ->postJson('/api/1.0/environments', [
            'collection_id' => $collection->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('name');
});
