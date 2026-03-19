<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionOverviewController;
use App\Http\Controllers\WorkspaceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('1.0')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::get('ping', function () {
        return ['pong' => true];
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::get('status', function (Request $request) {
            return [
                'status' => 'authorized',
                'user' => $request->user()?->only('id', 'email'),
            ];
        });
        Route::get('collections/overview', [CollectionOverviewController::class, 'show']);
        Route::get('workspaces', [WorkspaceController::class, 'index']);
        Route::post('workspaces', [WorkspaceController::class, 'store']);
        Route::post('workspaces/{workspace}/users', [WorkspaceController::class, 'attachUser']);
        Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });
});
