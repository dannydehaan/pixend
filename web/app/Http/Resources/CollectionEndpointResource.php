<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CollectionEndpointResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'method' => $this->method,
            'route' => $this->route,
            'description' => $this->description,
            'category' => $this->category,
            'cache' => $this->cache,
            'priority' => $this->priority,
            'access' => $this->access,
        ];
    }
}
