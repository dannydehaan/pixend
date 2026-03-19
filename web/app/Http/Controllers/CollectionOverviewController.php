<?php

namespace App\Http\Controllers;

use App\Http\Resources\CollectionOverviewResource;
use Illuminate\Http\Request;

class CollectionOverviewController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $workspace = $user->workspaces()->with(['collections.endpoints'])->first();

        if (! $workspace) {
            return response()->json(['message' => 'No collections found yet.'], 404);
        }

        $collection = $workspace->collections->first();

        if (! $collection) {
            return response()->json(['message' => 'No collections found yet.'], 404);
        }

        return new CollectionOverviewResource($collection);
    }
}
