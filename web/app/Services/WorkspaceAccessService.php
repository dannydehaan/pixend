<?php

namespace App\Services;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceType;
use Illuminate\Auth\Access\AuthorizationException;

class WorkspaceAccessService
{
    public function ensureAccess(Workspace $workspace, ?User $user = null, bool $requiresWrite = false): void
    {
        if ($workspace->isLocal() && ! $user) {
            return;
        }

        if (! $user) {
            throw new AuthorizationException('Authentication is required to access this workspace.');
        }

        if ($workspace->isLocal()) {
            $this->ensureMembership($workspace, $user);
            return;
        }

        if ($workspace->isPremium() && $requiresWrite && ! $user->is_premium) {
            throw new AuthorizationException('Premium workspaces require an active premium subscription.');
        }

        if ($workspace->isCompany()) {
            $organization = $workspace->organization;

            if (! $organization) {
                throw new AuthorizationException('This workspace is not linked to an organization.');
            }

            if (
                $user->is($workspace->owner) ||
                $organization->users()->where('users.id', $user->id)->exists()
            ) {
                return;
            }

            throw new AuthorizationException('You must be part of the organization to access this workspace.');
        }

        if ($workspace->owner_id === $user->id) {
            return;
        }

        if ($workspace->users()->where('users.id', $user->id)->exists()) {
            return;
        }

        if ($workspace->organization_id && $user->organizations()->where('organization_id', $workspace->organization_id)->exists()) {
            return;
        }
    }

    public function ensureMembership(Workspace $workspace, ?User $user): void
    {
        if ($workspace->isLocal() && ! $user) {
            return;
        }

        if (! $user || ! $this->userIsMember($workspace, $user)) {
            throw new AuthorizationException('You are not a member of this workspace.');
        }
    }

    public function resolveWorkspaceForUser(int $workspaceId, ?User $user, bool $requiresWrite = true): Workspace
    {
        $workspace = Workspace::with(['organization', 'users'])->findOrFail($workspaceId);

        $this->ensureAccess($workspace, $user, $requiresWrite);
        $this->ensureMembership($workspace, $user);

        return $workspace;
    }

    public function ensureWritable(Workspace $workspace, ?User $user): void
    {
        $this->ensureAccess($workspace, $user, true);
    }

    public function ensureReadable(Workspace $workspace, ?User $user): void
    {
        $this->ensureAccess($workspace, $user, false);
    }

    private function userIsMember(Workspace $workspace, User $user): bool
    {
        if ($workspace->relationLoaded('users')) {
            return $workspace->users->contains('id', $user->id);
        }

        return $workspace->users()->where('users.id', $user->id)->exists();
    }
}
