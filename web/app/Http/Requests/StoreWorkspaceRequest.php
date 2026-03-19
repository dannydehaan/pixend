<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'slug' => ['required', 'string', 'max:255', 'unique:workspaces,slug'],
            'type' => ['nullable', 'string', 'in:local,company,premium_personal'],
            'description' => ['nullable', 'string', 'max:1000'],
            'workspace_type' => ['nullable', 'string', 'exists:workspace_types,slug'],
            'organization_id' => ['nullable', 'integer', 'exists:organizations,id'],
        ];
    }
}
