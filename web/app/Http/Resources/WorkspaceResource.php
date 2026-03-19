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
            'type' => $this->type,
            'workspace_type' => $this->whenLoaded('workspaceType', fn () => [
                'id' => $this->workspaceType->id,
                'slug' => $this->workspaceType->slug,
                'name' => $this->workspaceType->name,
                'description' => $this->workspaceType->description,
                'sync_enabled' => $this->workspaceType->sync_enabled,
                'requires_organization' => $this->workspaceType->requires_organization,
            ]),
            'organization' => $this->whenLoaded('organization', fn () => [
                'id' => $this->organization->id,
                'name' => $this->organization->name,
                'slug' => $this->organization->slug,
            ]),
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
                'email' => $this->owner->email,
            ]),
            'sync_enabled' => $this->sync_enabled,
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
