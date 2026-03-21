<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\CollectionOverviewController;
use App\Http\Controllers\EnvironmentController;
use App\Http\Controllers\RequestController;
use App\Http\Controllers\EnvironmentVariableController;
use App\Http\Controllers\SecureEnvironmentController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\UserThemeController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

    Route::prefix('1.0')->group(function () {
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/login', [AuthController::class, 'login']);
        Route::get('ping', function () {
            return ['pong' => true];
        });

        Route::get('themes', [ThemeController::class, 'index']);

        Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::get('status', function (Request $request) {
            return [
                'status' => 'authorized',
                'user' => $request->user()?->only('id', 'email'),
            ];
        });
        Route::get('collections/overview', [CollectionOverviewController::class, 'show']);
        Route::post('collections', [CollectionController::class, 'store']);
        Route::post('environments', [EnvironmentController::class, 'store']);
        Route::post('requests', [RequestController::class, 'store']);
        Route::get('requests', [RequestController::class, 'index']);
        Route::post('secure-environments', [SecureEnvironmentController::class, 'store']);
        Route::get('secure-environments', [SecureEnvironmentController::class, 'index']);
        Route::delete('secure-environments/{id}', [SecureEnvironmentController::class, 'destroy']);

        Route::get('env-vars', [EnvironmentVariableController::class, 'index']);
        Route::post('env-vars', [EnvironmentVariableController::class, 'store']);
        Route::put('env-vars/{variable}', [EnvironmentVariableController::class, 'update']);
        Route::delete('env-vars/{variable}', [EnvironmentVariableController::class, 'destroy']);
        Route::post('env-vars/{variable}/reveal', [EnvironmentVariableController::class, 'reveal']);
        Route::get('workspaces', [WorkspaceController::class, 'index']);
        Route::post('workspaces', [WorkspaceController::class, 'store']);
        Route::post('workspaces/{workspace}/users', [WorkspaceController::class, 'attachUser']);
        Route::patch('workspaces/{workspace}/type', [WorkspaceController::class, 'upgrade']);
        Route::get('user/theme', [UserThemeController::class, 'show']);
        Route::patch('user/theme', [UserThemeController::class, 'update']);
        Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });
});
