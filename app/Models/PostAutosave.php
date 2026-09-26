<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Text an editor has typed but not saved yet. There is at most one per post
 * and user; saving the post for real makes it obsolete.
 *
 * @property int $id
 * @property int $post_id
 * @property int $user_id
 * @property string|null $title
 * @property string|null $excerpt
 * @property string|null $content
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
class PostAutosave extends Model
{
    /** The post fields an autosave keeps. */
    public const FIELDS = ['title', 'excerpt', 'content'];

    protected $guarded = ['id'];

    /**
     * @return BelongsTo<Post, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Whether it still holds anything the post itself doesn't.
     */
    public function differsFrom(Post $post): bool
    {
        foreach (self::FIELDS as $field) {
            if ((string) $this->{$field} !== (string) $post->{$field}) {
                return true;
            }
        }

        return false;
    }
}
