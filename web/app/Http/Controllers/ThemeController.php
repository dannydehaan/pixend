<?php

namespace App\Http\Controllers;

use App\Support\ThemeManager;
use Illuminate\Http\JsonResponse;

class ThemeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'themes' => ThemeManager::all(),
        ]);
    }
}
