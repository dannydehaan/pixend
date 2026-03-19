<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnvironmentRequest;
use App\Http\Resources\EnvironmentResource;
use App\Models\Collection;
use App\Services\WorkspaceAccessService;

class EnvironmentController extends Controller
{
    public function store(StoreEnvironmentRequest $request, WorkspaceAccessService $accessService)
    {
        $collection = Collection::with('workspace')->findOrFail($request->collection_id);

        $accessService->resolveWorkspaceForUser($collection->workspace_id, $request->user());

        $environment = $collection->environments()->create([
            'name' => $request->name,
            'region' => $request->region,
            'description' => $request->description,
            'settings' => $request->settings,
        ]);

        return (new EnvironmentResource($environment))->response()->setStatusCode(201);
    }
}
