<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class EnvironmentResource extends JsonResource
{
    public function toArray($request): array
    {
        $environment = $this->resource;

        return [
            'id' => $environment->id,
            'collection_id' => $environment->collection_id,
            'name' => $environment->name,
            'region' => $environment->region,
            'description' => $environment->description,
            'settings' => $environment->settings,
            'created_at' => $environment->created_at?->toIso8601String(),
        ];
    }
}
