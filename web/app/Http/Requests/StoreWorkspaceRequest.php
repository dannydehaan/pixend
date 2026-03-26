<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\WorkspaceType;

class StoreWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        'slug' => ['nullable', 'string', 'max:255', 'unique:workspaces,slug'],
            'type' => [
                'nullable',
                'string',
                Rule::in([
                    WorkspaceType::LOCAL,
                    WorkspaceType::COMPANY,
                    WorkspaceType::PREMIUM,
                ]),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'workspace_type' => ['nullable', 'string', 'exists:workspace_types,slug'],
            'organization_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn () => $this->input('type') === WorkspaceType::COMPANY),
                'exists:organizations,id',
            ],
        ];
    }
}
