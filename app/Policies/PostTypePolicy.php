<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PostType;

class PostTypePolicy
{
    public function viewAny(User $user): bool { return $user->can('view post types'); }
    public function view(User $user, PostType $postType): bool { return $user->can('view post types'); }
    public function create(User $user): bool { return $user->can('create post types'); }
    public function update(User $user, PostType $postType): bool { return $user->can('edit post types'); }
    public function delete(User $user, PostType $postType): bool { return $user->can('delete post types'); }
}
