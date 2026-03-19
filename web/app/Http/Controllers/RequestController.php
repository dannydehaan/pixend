<?php

namespace App\Http\Controllers;

use App\Models\RequestModel;
use Illuminate\Http\Request;

class RequestController extends Controller
{
    public function index()
    {
        $requests = RequestModel::orderByDesc('created_at')->get();

        return response()->json(['data' => $requests]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'encrypted_payload' => ['required', 'array'],
        ]);

        $record = RequestModel::create($validated);

        return response()->json(['data' => $record], 201);
    }
}
