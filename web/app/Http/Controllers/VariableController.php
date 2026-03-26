<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\Environment;
use App\Models\Variable;
use Illuminate\Http\Request;

class VariableController extends Controller
{
    public function index(Request $request)
    {
        $query = Variable::query();

        if ($request->filled('environment_id')) {
            $query->where('variableable_type', Environment::class)
                ->where('variableable_id', $request->input('environment_id'));
        } elseif ($request->filled('collection_id')) {
            $query->where('variableable_type', Collection::class)
                ->where('variableable_id', $request->input('collection_id'));
        }

        $metadata = $query
            ->orderByDesc('updated_at')
            ->get()
            ->map(function (Variable $variable) {
                return $this->extractMetadata($variable);
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
        ]);

        $owner = $this->resolveOwner($validated);

        $variable = new Variable([
            'key' => $validated['key'],
            'encrypted_value' => $validated['value'],
        ]);

        $variable->variableable_type = $owner['type'];
        $variable->variableable_id = $owner['id'];
        $variable->save();

        return response()->json(['data' => $this->extractMetadata($variable)], 201);
    }

    public function update(Request $request, Variable $variable)
    {
        $validated = $request->validate([
            'key' => ['sometimes', 'string', 'max:255'],
            'value' => ['sometimes', 'string'],
        ]);

        if (array_key_exists('value', $validated)) {
            $variable->encrypted_value = $validated['value'];
            unset($validated['value']);
        }

        $variable->update($validated);

        return response()->json(['data' => $this->extractMetadata($variable)]);
    }

    public function destroy(Variable $variable)
    {
        $variable->delete();
        return response()->json(['success' => true]);
    }

    public function reveal(Variable $variable)
    {
        $this->authorize('viewSensitiveValue', $variable);

        return response()->json(['data' => ['id' => $variable->id, 'value' => $variable->encrypted_value]]);
    }

    private function extractMetadata(Variable $variable): array
    {
        return [
            'id' => $variable->id,
            'key' => $variable->key,
            'environment_id' => $this->belongsToEnvironment($variable) ? $variable->variableable_id : null,
            'collection_id' => $this->belongsToCollection($variable) ? $variable->variableable_id : null,
            'created_at' => $variable->created_at,
            'updated_at' => $variable->updated_at,
        ];
    }

    private function resolveOwner(array $validated): array
    {
        if (!empty($validated['environment_id'])) {
            return ['type' => Environment::class, 'id' => $validated['environment_id']];
        }

        if (!empty($validated['collection_id'])) {
            return ['type' => Collection::class, 'id' => $validated['collection_id']];
        }

        abort(422, 'Either environment_id or collection_id is required.');
    }

    private function belongsToEnvironment(Variable $variable): bool
    {
        return $variable->variableable_type === Environment::class;
    }

    private function belongsToCollection(Variable $variable): bool
    {
        return $variable->variableable_type === Collection::class;
    }
}
