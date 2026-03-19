<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Example response (201):
     * {
     *     "user": {"id": 1, "name": "Jane", "email": "jane@example.com"},
     *     "token": "<plain-text-token>"
     * }
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $salt = base64_encode(random_bytes(16));

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'encryption_salt' => $salt,
        ]);

        $workspaceType = WorkspaceType::firstWhere('slug', WorkspaceType::PREMIUM) ?? WorkspaceType::getDefaultType();

        $existing = $user->workspaces()
            ->where('owner_id', $user->id)
            ->where('type', WorkspaceType::PREMIUM)
            ->first();

        if ($existing) {
            $token = $user->createToken('api-token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
            ], 201);
        }

        $workspace = Workspace::create([
            'name' => $user->name . "'s Workspace",
            'slug' => Str::slug($user->name . ' workspace-' . uniqid()),
            'description' => 'Personal workspace for ' . $user->name,
            'type' => WorkspaceType::PREMIUM,
            'workspace_type_id' => $workspaceType->id,
            'owner_id' => $user->id,
            'organization_id' => null,
            'sync_enabled' => true,
        ]);

        $user->workspaces()->attach($workspace);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Example response:
     * {
     *     "user": {"id": 1, "name": "Jane", "email": "jane@example.com"},
     *     "token": "<plain-text-token>"
     * }
     */

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (! $user->encryption_salt) {
            $user->encryption_salt = base64_encode(random_bytes(16));
            $user->saveQuietly();
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out',
            'user' => $user?->only('id', 'email'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }
}
