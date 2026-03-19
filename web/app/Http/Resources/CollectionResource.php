<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CollectionResource extends JsonResource
{
    public function toArray($request): array
    {
        $collection = $this->resource;

        return [
            'id' => $collection->id,
            'name' => $collection->name,
            'description' => $collection->description,
            'workspace_id' => $collection->workspace_id,
            'endpoint_count' => $collection->endpoint_count,
            'status' => $collection->status,
            'access_level' => $collection->access_level,
            'created_at' => $collection->created_at?->toIso8601String(),
        ];
    }
}
