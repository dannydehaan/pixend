<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceType;
use Illuminate\Auth\Access\HandlesAuthorization;

class CollectionPolicy
{
    use HandlesAuthorization;

    public function create(User $user, Workspace $workspace): bool
    {
        if ($workspace->owner_id === $user->id) {
            return true;
        }

        if ($workspace->users()->where('users.id', $user->id)->exists()) {
            return true;
        }

        if ($workspace->type === WorkspaceType::PREMIUM && $workspace->owner_id === $user->id) {
            return true;
        }

        return false;
    }
}
