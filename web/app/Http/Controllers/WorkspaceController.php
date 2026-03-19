<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachWorkspaceUserRequest;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Organization;
use App\Models\Workspace;
use App\Models\WorkspaceType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workspaces = $request->user()->workspaces()->with(['users', 'workspaceType', 'organization', 'owner', 'collections.environments'])->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        $payload = $request->validated();
        $typeSlug = $request->input('workspace_type') ?? WorkspaceType::LOCAL;
        $type = WorkspaceType::where('slug', $typeSlug)->first() ?? WorkspaceType::getDefaultType();
        $syncEnabled = in_array($type->slug, [WorkspaceType::COMPANY, WorkspaceType::PREMIUM_PERSONAL], true);

        if ($type->requires_organization) {
            $organizationId = $request->validated()['organization_id'] ?? null;
            $organization = Organization::where('id', $organizationId)
                ->whereHas('users', fn ($query) => $query->where('users.id', $request->user()->id))
                ->firstOrFail();
        } else {
            $organization = null;
        }

        if ($type->slug === WorkspaceType::PREMIUM_PERSONAL && ! $request->user()->is_premium) {
            throw ValidationException::withMessages([
                'workspace_type' => 'Premium personal workspaces require a premium account.',
            ]);
        }

        $workspaceData = [
            'name' => $payload['name'],
            'slug' => $payload['slug'],
            'description' => $payload['description'] ?? null,
            'type' => $type->slug,
            'workspace_type_id' => $type->id,
            'owner_id' => $request->user()->id,
            'sync_enabled' => $syncEnabled,
        ];

        if ($organization) {
            $workspaceData['organization_id'] = $organization->id;
        }

        $workspace = Workspace::create($workspaceData);
        $workspace->users()->attach($request->user());

        return new WorkspaceResource($workspace->load(['users', 'workspaceType', 'organization', 'owner']));
    }

    public function attachUser(AttachWorkspaceUserRequest $request, Workspace $workspace): WorkspaceResource
    {
        $workspace->users()->syncWithoutDetaching($request->user_id);

        return new WorkspaceResource($workspace->refresh()->load(['users', 'workspaceType', 'organization', 'owner']));
    }
}
