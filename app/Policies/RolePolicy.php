<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view roles');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->can('view roles');
    }

    public function create(User $user): bool
    {
        return $user->can('create roles');
    }

    public function update(User $user, Role $role): bool
    {
        return $user->can('edit roles');
    }

    public function delete(User $user, Role $role): bool
    {
        if ($role->name === 'super-admin') {
            return false;
        }
        return $user->can('delete roles');
    }
}
