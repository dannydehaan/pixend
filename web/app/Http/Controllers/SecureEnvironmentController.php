<?php

namespace App\Http\Controllers;

use App\Models\SecureEnvironment;
use Illuminate\Http\Request;

class SecureEnvironmentController extends Controller
{
    public function index()
    {
        return response()->json(['data' => SecureEnvironment::orderByDesc('created_at')->get()]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'encrypted_variables' => ['required', 'array'],
        ]);

        $record = SecureEnvironment::create($validated);

        return response()->json(['data' => $record], 201);
    }

    public function destroy($id)
    {
        $environment = SecureEnvironment::findOrFail($id);
        $environment->delete();

        return response()->json(['success' => true]);
    }
}
