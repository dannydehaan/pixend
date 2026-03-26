<?php

namespace App\Http\Requests;

use App\Models\MockServer;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMockServerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        if (! $user?->is_premium) {
            return false;
        }

        $mockServer = $this->route('mock_server');
        if (! $mockServer instanceof MockServer) {
            return false;
        }

        return $mockServer->user_id === $user->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $userId = $this->user()?->id;
        $mockServer = $this->route('mock_server');
        $mockServerId = $mockServer instanceof MockServer ? $mockServer->id : null;

        $portRule = Rule::unique('mock_servers', 'port');
        if ($userId) {
            $portRule = $portRule->where(fn ($query) => $query->where('user_id', $userId));
        }

        if ($mockServerId) {
            $portRule = $portRule->ignore($mockServerId);
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'between:1024,65535', $portRule],
        ];
    }
}
