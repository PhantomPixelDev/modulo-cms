<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Post;

class PostPolicy
{
    public function viewAny(User $user): bool { return $user->can('view posts'); }
    public function view(User $user, Post $post): bool { return $user->can('view posts'); }
    public function create(User $user): bool { return $user->can('create posts'); }
    public function update(User $user, Post $post): bool { return $user->can('edit posts'); }
    public function delete(User $user, Post $post): bool { return $user->can('delete posts'); }
}
