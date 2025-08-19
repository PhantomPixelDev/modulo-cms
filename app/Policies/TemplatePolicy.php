<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Template;

class TemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('view templates');
    }

    public function view(User $user, Template $template): bool
    {
        return $user->can('view templates');
    }

    public function create(User $user): bool
    {
        return $user->can('create templates');
    }

    public function update(User $user, Template $template): bool
    {
        return $user->can('edit templates');
    }

    public function delete(User $user, Template $template): bool
    {
        return $user->can('delete templates');
    }
}
