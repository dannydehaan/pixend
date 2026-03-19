<?php

namespace App\Http\Requests;

use App\Services\WorkspaceAccessService;
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

        try {
            app(WorkspaceAccessService::class)->resolveWorkspaceForUser($workspaceId, $this->user());
        } catch (\Throwable) {
            return false;
        }

        return true;
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
