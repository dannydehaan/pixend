<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMockServerRequest;
use App\Http\Requests\UpdateMockServerRequest;
use App\Http\Resources\MockServerResource;
use App\Models\MockServer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Response;

class MockServerController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $mockServers = $request->user()->mockServers()->get();

        return MockServerResource::collection($mockServers);
    }

    public function store(StoreMockServerRequest $request): JsonResponse
    {
        $mockServer = $request->user()->mockServers()->create($request->validated());

        return (new MockServerResource($mockServer))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateMockServerRequest $request, MockServer $mockServer): MockServerResource
    {
        $mockServer->update($request->validated());

        return new MockServerResource($mockServer);
    }

    public function destroy(Request $request, MockServer $mockServer): HttpResponse
    {
        $this->ensurePremium($request->user());
        $this->ensureOwnership($mockServer, $request->user()?->id);

        $mockServer->delete();

        return Response::noContent();
    }

    private function ensurePremium($user): void
    {
        if (! $user?->is_premium) {
            abort(403);
        }
    }

    private function ensureOwnership(MockServer $mockServer, ?int $userId): void
    {
        if ($mockServer->user_id !== $userId) {
            abort(403);
        }
    }
}
