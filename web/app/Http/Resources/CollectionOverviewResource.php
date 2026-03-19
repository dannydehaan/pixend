<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CollectionOverviewResource extends JsonResource
{
    public function toArray($request): array
    {
        $collection = $this->resource;

        return [
            'hero' => [
                'name' => $collection->name,
                'version' => $collection->version,
                'description' => $collection->description,
                'endpoint_count' => $collection->endpoint_count,
                'updated_at' => $collection->last_synced_at?->toIso8601String(),
                'access_level' => $collection->access_level,
                'status' => $collection->status,
            ],
            'endpoints' => CollectionEndpointResource::collection($collection->endpoints),
            'quick_specs' => [
                'base_url' => config('app.api_base', 'https://api.alpha.pixend.io'),
                'authentication' => 'Bearer token via /auth/login',
                'response_formats' => [
                    ['name' => 'JSON', 'label' => 'Default'],
                    ['name' => 'Protobuf', 'label' => 'Optional'],
                ],
                'health' => 'All regions operational',
            ],
        ];
    }
}
