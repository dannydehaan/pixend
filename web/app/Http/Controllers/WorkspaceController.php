<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttachWorkspaceUserRequest;
use App\Http\Requests\StoreWorkspaceRequest;
use App\Http\Resources\WorkspaceResource;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkspaceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $workspaces = $request->user()->workspaces()->with(['users', 'collections.environments'])->get();

        return WorkspaceResource::collection($workspaces);
    }

    public function store(StoreWorkspaceRequest $request): WorkspaceResource
    {
        $workspace = Workspace::create($request->validated());
        $workspace->users()->attach($request->user());

        return new WorkspaceResource($workspace->load('users'));
    }

    public function attachUser(AttachWorkspaceUserRequest $request, Workspace $workspace): WorkspaceResource
    {
        $workspace->users()->syncWithoutDetaching($request->user_id);

        return new WorkspaceResource($workspace->refresh()->load('users'));
    }
}
