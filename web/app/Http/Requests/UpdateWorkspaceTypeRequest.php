<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\WorkspaceType;

class UpdateWorkspaceTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $workspace = $this->route('workspace');

        return $user !== null
            && $workspace !== null
            && $workspace->owner_id === $user->id;
    }

    public function rules(): array
    {
        return [
            'type' => [
                'required',
                'string',
                Rule::in([
                    WorkspaceType::COMPANY,
                    WorkspaceType::PREMIUM,
                ]),
            ],
            'organization_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn () => $this->input('type') === WorkspaceType::COMPANY),
                'exists:organizations,id',
            ],
        ];
    }
}
