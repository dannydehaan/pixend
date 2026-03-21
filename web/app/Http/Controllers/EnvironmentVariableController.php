<?php

namespace App\Http\Controllers;

use App\Models\EnvironmentVariable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class EnvironmentVariableController extends Controller
{
    public function index(Request $request)
    {
        $query = EnvironmentVariable::query();
        if ($request->filled('environment_id')) {
            $query->where('environment_id', $request->input('environment_id'));
        }
        if ($request->filled('collection_id')) {
            $query->where('collection_id', $request->input('collection_id'));
        }

        $metadata = $query
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (EnvironmentVariable $variable) {
                return [
                    'id' => $variable->id,
                    'key' => $variable->key,
                    'sensitive' => $variable->sensitive,
                    'description' => $variable->description,
                    'environment_id' => $variable->environment_id,
                    'collection_id' => $variable->collection_id,
                    'created_at' => $variable->created_at,
                    'updated_at' => $variable->updated_at,
                ];
            });

        return response()->json(['data' => $metadata]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'environment_id' => ['nullable', 'integer', 'exists:environments,id'],
            'collection_id' => ['nullable', 'integer', 'exists:collections,id'],
            'key' => ['required', 'string', 'max:255'],
            'value' => ['required', 'string'],
            'sensitive' => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);

        if (empty($validated['environment_id']) && empty($validated['collection_id'])) {
            return response()->json(['message' => 'Either environment_id or collection_id is required.'], 422);
        }

        $payload = [
            'environment_id' => $validated['environment_id'] ?? null,
            'collection_id' => $validated['collection_id'] ?? null,
            'key' => $validated['key'],
            'encrypted_value' => Crypt::encryptString($validated['value']),
            'sensitive' => $validated['sensitive'] ?? true,
            'description' => $validated['description'] ?? null,
        ];

        $variable = EnvironmentVariable::create($payload);

        return response()->json(['data' => $this->extractMetadata($variable)], 201);
    }

    public function update(Request $request, EnvironmentVariable $variable)
    {
        $validated = $request->validate([
            'key' => ['sometimes', 'string', 'max:255'],
            'value' => ['sometimes', 'string'],
            'sensitive' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        if (array_key_exists('value', $validated)) {
            $validated['encrypted_value'] = Crypt::encryptString($validated['value']);
            unset($validated['value']);
        }

        $variable->update($validated);

        return response()->json(['data' => $this->extractMetadata($variable)]);
    }

    public function destroy(EnvironmentVariable $variable)
    {
        $variable->delete();
        return response()->json(['success' => true]);
    }

    public function reveal(EnvironmentVariable $variable)
    {
        $value = Crypt::decryptString($variable->encrypted_value);
        return response()->json(['data' => ['id' => $variable->id, 'value' => $value]]);
    }

    private function extractMetadata(EnvironmentVariable $variable): array
    {
        return [
            'id' => $variable->id,
            'key' => $variable->key,
            'sensitive' => $variable->sensitive,
            'description' => $variable->description,
            'environment_id' => $variable->environment_id,
            'collection_id' => $variable->collection_id,
            'created_at' => $variable->created_at,
            'updated_at' => $variable->updated_at,
        ];
    }
}
