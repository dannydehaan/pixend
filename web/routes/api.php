<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->get('/status', function (Request $request) {
    return [
        'status' => 'authorized',
        'user' => $request->user()?->only('id', 'email'),
    ];
});
