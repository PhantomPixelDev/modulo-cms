<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Assigning content to someone else is a privilege, not a default: anyone
 * with edit rights can already touch anyone's posts, but a plain contributor
 * (create-only) must not spoof authorship.
 */
class AssignAuthor implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        $user = auth()->user();

        if ($user && (int) $value !== (int) $user->id
            && ! $user->can('edit posts')
            && ! $user->can('assign posts author')
        ) {
            $fail('You may only assign content to yourself.');
        }
    }
}
