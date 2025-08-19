<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view users');
    }

    public function view(User $user, User $model): bool
    {
        return $user->can('view users');
    }

    public function create(User $user): bool
    {
        return $user->can('create users');
    }

    public function update(User $user, User $model): bool
    {
        // Only super-admins can edit super-admin accounts
        if ($model->hasRole('super-admin') && !$user->hasRole('super-admin')) {
            return false;
        }
        return $user->can('edit users');
    }

    public function delete(User $user, User $model): bool
    {
        if ($user->id === $model->id) {
            return false; // cannot delete self
        }
        if ($model->hasRole('super-admin')) {
            return false; // cannot delete super-admin
        }
        return $user->can('delete users');
    }
}
