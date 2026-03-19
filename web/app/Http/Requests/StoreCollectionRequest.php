<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCollectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'workspace_id' => [
                'required',
                'integer',
                Rule::exists('user_workspace', 'workspace_id')->where('user_id', $this->user()->id),
            ],
            'description' => ['nullable', 'string'],
        ];
    }
}
