<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MenuItem;

class MenuItemPolicy
{
    public function viewAny(User $user): bool { return $user->can('view menus'); }
    public function view(User $user, MenuItem $item): bool { return $user->can('view menus'); }
    public function create(User $user): bool { return $user->can('edit menus'); }
    public function update(User $user, MenuItem $item): bool { return $user->can('edit menus'); }
    public function delete(User $user, MenuItem $item): bool { return $user->can('edit menus'); }
}
