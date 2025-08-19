<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Theme;

class ThemePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view themes');
    }

    public function view(User $user, Theme $theme): bool
    {
        return $user->can('view themes');
    }

    public function update(User $user, Theme $theme): bool
    {
        return $user->can('edit themes');
    }

    public function delete(User $user, Theme $theme): bool
    {
        return $user->can('delete themes');
    }

    // Custom actions
    public function install(User $user): bool
    {
        return $user->can('install themes');
    }

    public function activate(User $user, Theme $theme): bool
    {
        return $user->can('activate themes');
    }

    public function publishAssets(User $user, Theme $theme): bool
    {
        return $user->can('publish theme assets');
    }

    public function customize(User $user, Theme $theme): bool
    {
        return $user->can('customize themes');
    }
}
