<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnvironmentRequest;
use App\Http\Resources\EnvironmentResource;
use App\Models\Collection;

class EnvironmentController extends Controller
{
    public function store(StoreEnvironmentRequest $request)
    {
        $collection = Collection::where('id', $request->collection_id)
            ->whereHas('workspace.users', fn ($query) => $query->where('user_workspace.user_id', $request->user()->id))
            ->firstOrFail();

        $environment = $collection->environments()->create([
            'name' => $request->name,
            'region' => $request->region,
            'description' => $request->description,
            'settings' => $request->settings,
        ]);

        return (new EnvironmentResource($environment))->response()->setStatusCode(201);
    }
}
