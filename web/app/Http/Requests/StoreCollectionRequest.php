<?php

namespace App\Http\Requests;

use App\Models\Collection;
use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()) {
            return false;
        }

        $workspaceId = (int) $this->input('workspace_id');

        if (! $workspaceId) {
            return false;
        }

        $workspace = Workspace::with('users')->find($workspaceId);

        if (! $workspace) {
            return false;
        }

        return $this->user()->can('create', [Collection::class, $workspace]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'workspace_id' => [
                'required',
                'integer',
                Rule::exists('workspaces', 'id'),
            ],
            'description' => ['nullable', 'string'],
        ];
    }
}
