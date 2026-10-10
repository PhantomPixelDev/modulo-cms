<?php

namespace App\Rules;

use App\Models\Post;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Publishing is its own permission: someone who may write posts but not
 * publish them (a moderator, a contributor role) saves drafts for an editor.
 *
 * Publication includes scheduling and changing a release date. Text-only
 * editing preserves the existing publication state with the edit permission.
 */
class CanPublish implements ValidationRule
{
    public function __construct(
        private ?User $user,
        private ?Post $current = null,
        private bool $isPage = false,
        private mixed $publishedAt = null,
        private ?string $action = null,
    ) {}

    public static function permissionFor(bool $isPage): string
    {
        return $isPage ? 'publish content' : 'publish posts';
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value !== 'published') {
            return;
        }

        if ($this->current?->status === 'published' && ! in_array($this->action, ['publish', 'schedule'], true)) {
            try {
                $date = $this->publishedAt === null ? $this->current->published_at : Carbon::parse($this->publishedAt);
                // Editing text is allowed. Changing a publication date is a
                // publication action, including releasing a scheduled item.
                if ($date?->equalTo($this->current->published_at) || ($date === null && $this->current->published_at === null)) {
                    return;
                }
            } catch (Throwable) {
                // The date rule reports malformed dates separately.
                return;
            }
        }

        if ($this->user?->can(self::permissionFor($this->isPage))) {
            return;
        }

        $fail('You may not publish. Save it as a draft for an editor to publish.');
    }

    public static function forRequest(Request $request, ?Post $post = null, bool $isPage = false): self
    {
        return new self($request->user(), $post, $isPage, $request->input('published_at'), $request->input('editor_action'));
    }

    public static function checkRequest(Request $request, ?Post $post = null, bool $isPage = false): void
    {
        self::forRequest($request, $post, $isPage)->validate('status', $request->input('status', $post?->status), function (string $message) {
            throw ValidationException::withMessages(['status' => $message]);
        });
    }
}
