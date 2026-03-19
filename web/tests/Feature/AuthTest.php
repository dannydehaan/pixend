<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows a user to register via API', function () {
    $payload = [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'secret123!',
        'password_confirmation' => 'secret123!',
    ];

    $response = $this->postJson('/api/1.0/auth/register', $payload);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token',
        ]);

    $this->assertDatabaseHas('users', ['email' => 'jane@example.com']);
});

it('returns a token when logging in with valid credentials', function () {
    $password = 'secure-pass-1';
    $user = User::factory()->create(['password' => bcrypt($password)]);

    $response = $this->postJson('/api/1.0/auth/login', [
        'email' => $user->email,
        'password' => $password,
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email'],
            'token',
        ]);
});

it('denies invalid login attempts', function () {
    $user = User::factory()->create();

    $this->postJson('/api/1.0/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])
        ->assertStatus(401)
        ->assertJson(['message' => 'Invalid credentials.']);
});

it('allows an authenticated user to logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api-token')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/1.0/auth/logout')
        ->assertOk()
        ->assertJson([ 'message' => 'Logged out' ]);
});

it('returns the current user via /auth/me when the token is valid', function () {
    $user = User::factory()->create();
    $token = $user->createToken('api-token')->plainTextToken;

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/1.0/auth/me')
        ->assertOk()
        ->assertJson([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
});

it('denies /auth/me when the token is invalid', function () {
    $this->withHeader('Authorization', 'Bearer invalid-token')
        ->getJson('/api/1.0/auth/me')
        ->assertStatus(401);
});
