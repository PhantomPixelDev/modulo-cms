<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * A previous version of a post's text: saved whenever the title, excerpt,
 * content or SEO fields change, so an edit can be undone.
 *
 * @property int $id
 * @property int $post_id
 * @property int|null $user_id
 * @property string $title
 * @property string|null $excerpt
 * @property string|null $content
 * @property string|null $meta_title
 * @property string|null $meta_description
 * @property Carbon $created_at
 */
class PostRevision extends Model
{
    public const UPDATED_AT = null;

    /** The post fields a revision keeps. */
    public const FIELDS = ['title', 'excerpt', 'content', 'meta_title', 'meta_description'];

    protected $guarded = ['id'];

    protected $casts = ['created_at' => 'datetime'];

    /**
     * @return BelongsTo<Post, $this>
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
