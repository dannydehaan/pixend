<?php

namespace App\Http\Requests;

use App\Models\Collection;
use App\Services\WorkspaceAccessService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEnvironmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()) {
            return false;
        }

        $collection = Collection::with('workspace')->find($this->input('collection_id'));

        if (! $collection) {
            return false;
        }

        try {
            app(WorkspaceAccessService::class)->resolveWorkspaceForUser($collection->workspace_id, $this->user());
        } catch (\Throwable) {
            return false;
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'collection_id' => [
                'required',
                'integer',
                Rule::exists('collections', 'id'),
            ],
            'region' => ['nullable', 'string', 'max:128'],
            'description' => ['nullable', 'string'],
            'settings' => ['nullable', 'array'],
        ];
    }
}
