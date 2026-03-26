<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachWorkspaceUserRequest;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Requests\UpdateWorkspaceTypeRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Organization;
use App\Models\Workspace;
use App\Models\WorkspaceType;
use App\Services\WorkspaceAccessService;
use App\Services\WorkspaceSyncService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workspaces = $request->user()->workspaces()->with(['users', 'workspaceType', 'organization', 'owner', 'collections.environments'])->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request, WorkspaceSyncService $syncService): WorkspaceResource
    {
        $payload = $request->validated();
        $typeKey = $payload['type'] ?? WorkspaceType::LOCAL;
        $type = WorkspaceType::firstWhere('slug', $typeKey) ?? WorkspaceType::getDefaultType();

        if ($typeKey === WorkspaceType::COMPANY) {
            $organizationId = $payload['organization_id'] ?? null;
            $organization = Organization::where('id', $organizationId)
                ->whereHas('users', fn ($query) => $query->where('users.id', $request->user()->id))
                ->firstOrFail();
        } else {
            $organization = null;
        }

        if ($typeKey === WorkspaceType::PREMIUM && ! $request->user()->is_premium) {
            $existingPersonal = Workspace::where('owner_id', $request->user()->id)
                ->whereNull('organization_id')
                ->where('type', WorkspaceType::PREMIUM)
                ->count();
            if ($existingPersonal >= 1) {
                throw ValidationException::withMessages([
                    'type' => 'Free users can create only one personal workspace. Upgrade to create more.',
                ]);
            }
        }

        $baseSlug = Str::slug($payload['slug'] ?? $payload['name']);
        $fallbackSlug = $baseSlug ?: (string) Str::uuid();
        $slug = $fallbackSlug;
        $counter = 1;
        while (Workspace::where('slug', $slug)->exists()) {
            $slug = $fallbackSlug . '-' . $counter;
            $counter++;
        }

        $workspaceData = [
            'name' => $payload['name'],
            'slug' => $slug,
            'description' => $payload['description'] ?? null,
            'type' => $typeKey,
            'workspace_type_id' => $type->id,
            'owner_id' => $request->user()->id,
            'organization_id' => $organization?->id,
            'sync_enabled' => $type->sync_enabled,
        ];

        $workspace = Workspace::create($workspaceData);
        $workspace->users()->attach($request->user());
        $syncService->requestSync($workspace, 'create', $workspace->toArray());

        return new WorkspaceResource($workspace->load(['users', 'workspaceType', 'organization', 'owner']));
    }

    public function attachUser(
        AttachWorkspaceUserRequest $request,
        Workspace $workspace,
        WorkspaceSyncService $syncService
    ): WorkspaceResource
    {
        $workspace->users()->syncWithoutDetaching($request->user_id);
        $syncService->requestSync($workspace, 'update', ['attached_user_id' => $request->user_id]);

        return new WorkspaceResource($workspace->refresh()->load(['users', 'workspaceType', 'organization', 'owner']));
    }

    public function upgrade(
        UpdateWorkspaceTypeRequest $request,
        Workspace $workspace,
        WorkspaceAccessService $accessService,
        WorkspaceSyncService $syncService
    ): WorkspaceResource
    {
        if ($workspace->type !== WorkspaceType::LOCAL) {
            throw ValidationException::withMessages([
                'type' => 'Only local workspaces can be upgraded.',
            ]);
        }

        $targetType = $request->input('type');

        if ($targetType === WorkspaceType::PREMIUM && ! $request->user()?->is_premium) {
            throw ValidationException::withMessages([
                'type' => 'Upgrading to a premium workspace requires an active premium account.',
            ]);
        }

        $accessService->ensureWritable($workspace, $request->user());

        $workspaceType = WorkspaceType::firstWhere('slug', $targetType) ?? WorkspaceType::getDefaultType();

        if ($targetType === WorkspaceType::COMPANY) {
            $organization = Organization::where('id', $request->organization_id)
                ->whereHas('users', fn ($query) => $query->where('users.id', $request->user()?->id))
                ->firstOrFail();

            $workspace->organization()->associate($organization);
        } else {
            $workspace->organization()->dissociate();
        }

        $workspace->update([
            'type' => $targetType,
            'workspace_type_id' => $workspaceType->id,
            'sync_enabled' => true,
        ]);

        $syncService->requestSync($workspace, 'upgrade', ['target_type' => $targetType]);

        return new WorkspaceResource($workspace->refresh()->load(['users', 'workspaceType', 'organization', 'owner']));
    }
}
