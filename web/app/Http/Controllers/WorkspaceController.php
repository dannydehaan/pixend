<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachWorkspaceUserRequest;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use App\Models\WorkspaceType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workspaces = $request->user()->workspaces()->with(['users', 'type', 'collections.environments'])->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        $payload = $request->validated();
        $type = WorkspaceType::where('slug', $request->input('workspace_type'))->first() ?? WorkspaceType::getDefaultType();
        $workspace = Workspace::create(array_merge($payload, ['workspace_type_id' => $type->id]));
        $workspace->users()->attach($request->user());

        return new WorkspaceResource($workspace->load(['users', 'type']));
    }

    public function attachUser(AttachWorkspaceUserRequest $request, Workspace $workspace): WorkspaceResource
    {
        $workspace->users()->syncWithoutDetaching($request->user_id);

        return new WorkspaceResource($workspace->refresh()->load('users'));
    }
}
