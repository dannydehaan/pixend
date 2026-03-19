<?php

namespace App\Http\Requests;

use App\Models\Collection;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEnvironmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()) {
            return false;
        }

        $collectionId = (int) $this->input('collection_id');

        return Collection::where('collections.id', $collectionId)
            ->whereHas('workspace.users', fn ($query) => $query->where('users.id', $this->user()->id))
            ->exists();
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
