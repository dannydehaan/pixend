<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserThemeRequest;
use App\Support\ThemeManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserThemeController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'theme' => ThemeManager::definition($request->user()?->preferred_theme),
        ]);
    }

    public function update(UpdateUserThemeRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(404);
        }

        $user->preferred_theme = $request->theme;
        $user->saveQuietly();

        return response()->json([
            'theme' => ThemeManager::definition($user->preferred_theme),
        ]);
    }
}
