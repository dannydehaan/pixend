<?php

namespace App\Http\Requests;

use App\Support\ThemeManager;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<string>|string>
     */
    public function rules(): array
    {
        $available = ThemeManager::available();

        return [
            'theme' => [
                'required',
                'string',
                Rule::in($available),
            ],
        ];
    }
}
