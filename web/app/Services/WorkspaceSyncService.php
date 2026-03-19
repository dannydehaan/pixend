<?php

namespace App\Services;

use App\Models\Workspace;

class WorkspaceSyncService
{
    private string $queuePath;

    public function __construct()
    {
        $this->queuePath = storage_path('app/workspace_sync_queue.json');
    }

    public function requestSync(Workspace $workspace, string $operation, array $payload = []): void
    {
        if (! $workspace->sync_enabled) {
            return;
        }

        $entry = [
            'workspace_id' => $workspace->id,
            'operation' => $operation,
            'payload' => $payload,
            'timestamp' => now()->toIso8601String(),
        ];

        $queue = $this->readQueue();
        $queue = collect($queue)->keyBy('workspace_id')->toArray();
        $queue[$workspace->id] = $entry;

        $this->writeQueue(array_values($queue));
    }

    public function processQueue(): void
    {
        $queue = $this->readQueue();

        foreach ($queue as $entry) {
            $this->dispatchRemoteSync($entry);
        }

        $this->writeQueue([]);
    }

    private function dispatchRemoteSync(array $entry): void
    {
        // Placeholder for remote sync integration.
        // Conflict resolution strategy: last write wins because queue entries are overwritten per workspace.
    }

    private function readQueue(): array
    {
        if (! file_exists($this->queuePath)) {
            return [];
        }

        $payload = file_get_contents($this->queuePath);

        return json_decode($payload ?: '[]', true) ?: [];
    }

    private function writeQueue(array $entries): void
    {
        if (! file_exists(dirname($this->queuePath))) {
            mkdir(dirname($this->queuePath), 0755, true);
        }

        file_put_contents($this->queuePath, json_encode($entries, JSON_PRETTY_PRINT));
    }
}
