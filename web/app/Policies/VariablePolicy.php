<?php

namespace App\Policies;

use App\Models\Collection;
use App\Models\Environment;
use App\Models\Variable;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class VariablePolicy
{
    use HandlesAuthorization;

    public function viewSensitiveValue(User $user, Variable $variable): bool
    {
        $owner = $variable->variableable;

        $workspace = null;

        if ($owner instanceof Environment) {
            $workspace = $owner->collection?->workspace;
        } elseif ($owner instanceof Collection) {
            $workspace = $owner->workspace;
        }

        if (! $workspace) {
            return false;
        }

        if ($workspace->owner_id === $user->id) {
            return true;
        }

        return $workspace->users()->where('users.id', $user->id)->exists();
    }
}
