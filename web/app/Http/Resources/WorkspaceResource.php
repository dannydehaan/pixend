<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class WorkspaceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'users' => $this->whenLoaded('users', fn () => $this->users->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ])),
            'type' => $this->whenLoaded('type', fn () => [
                'id' => $this->type->id,
                'slug' => $this->type->slug,
                'name' => $this->type->name,
                'description' => $this->type->description,
                'sync_enabled' => $this->type->sync_enabled,
                'requires_organization' => $this->type->requires_organization,
            ]),
            'organization' => $this->whenLoaded('organization', fn () => [
                'id' => $this->organization->id,
                'name' => $this->organization->name,
                'slug' => $this->organization->slug,
            ]),
            'collections' => $this->whenLoaded('collections', fn () => $this->collections->map(fn ($collection) => [
                'id' => $collection->id,
                'name' => $collection->name,
                'description' => $collection->description,
                'endpoint_count' => $collection->endpoint_count,
                'status' => $collection->status,
                'access_level' => $collection->access_level,
                'created_at' => $collection->created_at?->toIso8601String(),
                'environments' => $collection->whenLoaded('environments', fn () => $collection->environments->map(fn ($environment) => [
                    'id' => $environment->id,
                    'name' => $environment->name,
                    'region' => $environment->region,
                    'description' => $environment->description,
                    'created_at' => $environment->created_at?->toIso8601String(),
                ])),
            ])),
        ];
    }
}
