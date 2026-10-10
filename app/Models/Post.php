<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\UniqueConstraintViolationException;

class Post extends Model
{
    use HasFactory, Prunable, SoftDeletes;

    protected $fillable = [
        'post_type_id',
        'author_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'status',
        'published_at',
        'parent_id',
        'menu_order',
        'meta_title',
        'meta_description',
        'meta_data',
        'view_count',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'meta_data' => 'array',
    ];

    /**
     * @return BelongsTo<PostType, $this>
     */
    public function postType(): BelongsTo
    {
        return $this->belongsTo(PostType::class);
    }

    /**
     * The public path of this post (its type's prefix, then the slug).
     */
    public function publicPath(?string $slug = null): string
    {
        $prefix = trim((string) $this->postType?->route_prefix, '/');
        $slug = trim($slug ?? (string) $this->slug, '/');

        return '/'.ltrim(($prefix !== '' ? $prefix.'/' : '').$slug, '/');
    }

    /**
     * A slug not used by any post, trashed ones included (the column is
     * unique): "hello", then "hello-2", "hello-3", ...
     */
    public static function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $base = $slug !== '' ? $slug : 'untitled';
        $candidate = $base;
        $suffix = 2;

        while (static::withTrashed()->whereRaw('LOWER(slug) = LOWER(?)', [$candidate])->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $candidate = $base.'-'.$suffix++;
        }

        return $candidate;
    }

    /**
     * Create a post with a unique slug, retrying on race condition.
     */
    public static function createWithUniqueSlug(array $attributes): self
    {
        $maxAttempts = 5;
        $attempt = 0;

        while (true) {
            try {
                return static::create($attributes);
            } catch (UniqueConstraintViolationException $e) {
                $attempt++;
                if ($attempt >= $maxAttempts) {
                    throw $e;
                }
                $attributes['slug'] = static::uniqueSlug($attributes['slug'] ?? 'untitled');
            }
        }
    }

    /**
     * Trashed posts past content.trash_days are purged by model:prune.
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        $days = (int) config('content.trash_days');

        return $days > 0
            ? static::onlyTrashed()->where('deleted_at', '<', now()->subDays($days))
            : static::query()->whereRaw('1 = 0');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Post::class, 'parent_id');
    }

    /**
     * Earlier versions, newest first.
     *
     * @return HasMany<PostRevision, $this>
     */
    public function revisions(): HasMany
    {
        return $this->hasMany(PostRevision::class)->orderByDesc('id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)
            ->whereNull('parent_id')
            ->where('status', 'approved')
            ->orderBy('created_at');
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(Comment::class)
            ->where('status', 'approved')
            ->orderBy('created_at');
    }

    /**
     * @return BelongsToMany<TaxonomyTerm, $this>
     */
    public function taxonomyTerms(): BelongsToMany
    {
        return $this->belongsToMany(TaxonomyTerm::class, 'post_taxonomy_terms')
            ->withTimestamps();
    }

    // Scopes for filtering
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    /**
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->published()->whereHas('postType', fn (Builder $type) => $type->where('is_public', true));
    }

    public function scopeByPostType($query, $postTypeId)
    {
        return $query->where('post_type_id', $postTypeId);
    }

    public function scopeByAuthor($query, $authorId)
    {
        return $query->where('author_id', $authorId);
    }

    /**
     * Get all translations for this post
     */
    public function translations(): HasMany
    {
        return $this->hasMany(PostTranslation::class);
    }

    /**
     * Get translation for a specific locale
     */
    public function translation(string $locale): ?PostTranslation
    {
        if ($this->relationLoaded('translations')) {
            return $this->translations->firstWhere('locale', $locale);
        }

        return $this->translations()->where('locale', $locale)->first();
    }

    /**
     * Get translation for locale or fallback to default
     */
    public function translationOrFallback(?string $locale = null): ?PostTranslation
    {
        $locale = $locale ?? app()->getLocale();

        $translation = $this->translation($locale);

        if (! $translation) {
            $defaultLocale = Locale::getDefault()?->code ?? 'en';
            $translation = $this->translation($defaultLocale);
        }

        return $translation;
    }

    /**
     * Get available locale codes for this post
     */
    public function availableLocales(): array
    {
        if ($this->relationLoaded('translations')) {
            return $this->translations->pluck('locale')->toArray();
        }

        return $this->translations()->pluck('locale')->toArray();
    }

    /**
     * Check if post has translation for locale
     */
    public function hasTranslation(string $locale): bool
    {
        if ($this->relationLoaded('translations')) {
            return $this->translations->contains('locale', $locale);
        }

        return $this->translations()->where('locale', $locale)->exists();
    }

    /**
     * Create or update a translation
     */
    public function setTranslation(string $locale, array $data): PostTranslation
    {
        return $this->translations()->updateOrCreate(
            ['locale' => $locale],
            $data
        );
    }
}
