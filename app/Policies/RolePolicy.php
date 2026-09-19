<?php

namespace App\Policies;

use App\Models\User;
use Spatie\Permission\Models\Role;

class RolePolicy
{
    /**
     * Roles the application relies on by name; they can't be renamed or deleted.
     */
    public const SYSTEM_ROLES = ['super-admin', 'admin', 'moderator', 'editor', 'user'];

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
        // Super-admins pass through Gate::before; nobody else may touch that role.
        if ($role->name === 'super-admin') {
            return false;
        }
        return $user->can('edit roles');
    }

    public function delete(User $user, Role $role): bool
    {
        if (in_array($role->name, self::SYSTEM_ROLES, true)) {
            return false;
        }
        return $user->can('delete roles');
    }
}
