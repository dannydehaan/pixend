<?php

declare(strict_types=1);

use App\Models\User;
use App\Support\ThemeManager;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('returns the authenticated user theme palette', function () {
    $user = User::factory()->create([
        'preferred_theme' => 'nord',
    ]);
    $token = $user->createToken('api-token')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/1.0/user/theme')
        ->assertOk()
        ->assertJsonStructure([
            'theme' => ['id', 'name', 'colors'],
        ])
        ->assertJsonFragment([
            'id' => 'nord',
        ]);
});

test('updates the theme preference when a valid theme is provided', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api-token')->plainTextToken;
    $theme = 'solarized-dark';

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson('/api/1.0/user/theme', ['theme' => $theme])
        ->assertOk()
        ->assertJsonStructure([
            'theme' => ['id', 'name', 'colors'],
        ])
        ->assertJsonFragment([
            'id' => $theme,
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'preferred_theme' => $theme,
    ]);
});

test('rejects invalid theme identifiers', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api-token')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson('/api/1.0/user/theme', ['theme' => 'unknown-theme'])
        ->assertStatus(422);
});

test('exposes the available theme palette list', function () {
    $response = $this->getJson('/api/1.0/themes');

    $response->assertOk()
        ->assertJsonStructure([
            'themes' => [['id', 'name', 'colors']],
        ])
        ->assertJsonFragment([
            'id' => ThemeManager::default(),
        ]);
});
