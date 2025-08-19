<?php

namespace App\Policies;

use App\Models\User;
use App\Models\TaxonomyTerm;

class TaxonomyTermPolicy
{
    public function viewAny(User $user): bool { return $user->can('view taxonomy terms'); }
    public function view(User $user, TaxonomyTerm $term): bool { return $user->can('view taxonomy terms'); }
    public function create(User $user): bool { return $user->can('create taxonomy terms'); }
    public function update(User $user, TaxonomyTerm $term): bool { return $user->can('edit taxonomy terms'); }
    public function delete(User $user, TaxonomyTerm $term): bool { return $user->can('delete taxonomy terms'); }
}
