<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCollectionRequest;
use App\Http\Resources\CollectionResource;
use App\Models\Collection;
use App\Services\WorkspaceAccessService;

class CollectionController extends Controller
{
    public function store(StoreCollectionRequest $request, WorkspaceAccessService $accessService)
    {
        $workspace = $accessService->resolveWorkspaceForUser($request->workspace_id, $request->user());

        $collection = $workspace->collections()->create([
            'name' => $request->name,
            'slug' => str()->slug($request->name),
            'description' => $request->description,
            'endpoint_count' => 0,
            'access_level' => 'private',
            'status' => 'draft',
        ]);

        return (new CollectionResource($collection))->response()->setStatusCode(201);
    }
}
