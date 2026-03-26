<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMockServerRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->is_premium ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        $portRule = Rule::unique('mock_servers', 'port');
        if ($userId) {
            $portRule = $portRule->where(fn ($query) => $query->where('user_id', $userId));
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'between:1024,65535', $portRule],
        ];
    }
}
