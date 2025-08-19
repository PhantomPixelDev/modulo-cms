<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Taxonomy;

class TaxonomyPolicy
{
    public function viewAny(User $user): bool { return $user->can('view taxonomies'); }
    public function view(User $user, Taxonomy $taxonomy): bool { return $user->can('view taxonomies'); }
    public function create(User $user): bool { return $user->can('create taxonomies'); }
    public function update(User $user, Taxonomy $taxonomy): bool { return $user->can('edit taxonomies'); }
    public function delete(User $user, Taxonomy $taxonomy): bool { return $user->can('delete taxonomies'); }
}
