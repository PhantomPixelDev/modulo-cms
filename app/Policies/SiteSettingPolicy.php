<?php

namespace App\Policies;

use App\Models\SiteSetting;
use App\Models\User;

class SiteSettingPolicy
{
    /**
     * Determine whether the user can view any settings.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['admin', 'super-admin']) || $user->can('view settings');
    }

    /**
     * Determine whether the user can view the settings.
     */
    public function view(User $user, SiteSetting $setting): bool
    {
        return $user->hasRole(['admin', 'super-admin']) || $user->can('view settings');
    }

    /**
     * Determine whether the user can update the settings.
     */
    public function update(User $user, ?SiteSetting $setting = null): bool
    {
        return $user->hasRole(['admin', 'super-admin']) || $user->can('edit settings');
    }
}
