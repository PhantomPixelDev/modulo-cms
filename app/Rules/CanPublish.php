<?php

namespace App\Rules;

use App\Models\Post;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Publishing is its own permission: someone who may write posts but not
 * publish them (a moderator, a contributor role) saves drafts for an editor.
 *
 * Only the move *to* published is checked. Editing something that is already
 * live stays with the edit permission, so fixing a typo on a published post
 * does not need the publish permission as well.
 */
class CanPublish implements ValidationRule
{
    public function __construct(
        private ?User $user,
        private ?Post $current = null,
        private bool $isPage = false,
    ) {}

    public static function permissionFor(bool $isPage): string
    {
        return $isPage ? 'publish content' : 'publish posts';
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value !== 'published' || $this->current?->status === 'published') {
            return;
        }

        if ($this->user?->can(self::permissionFor($this->isPage))) {
            return;
        }

        $fail('You may not publish. Save it as a draft for an editor to publish.');
    }
}
