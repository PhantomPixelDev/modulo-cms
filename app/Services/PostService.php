<?php

namespace App\Services;

use App\Http\Middleware\CachePublicPages;
use App\Models\Post;
use App\Models\PostType;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class PostService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    protected const CACHE_TTL = 3600;

    /**
     * Bumping this version invalidates every cached post lookup at once, so
     * renamed slugs, type-scoped keys and translations can never go stale.
     */
    protected const VERSION_KEY = 'posts:cache_version';

    /**
     * Get a published post by slug, optionally limited to a post type name ("post", "page").
     *
     * Comments are intentionally not cached; load them per request.
     */
    public function getPostBySlug(string $slug, ?string $postType = null, ?string $locale = null): ?Post
    {
        $locale ??= app()->getLocale();

        return $this->remember('name:'.($postType ?? 'any').":{$locale}:{$slug}", function () use ($slug, $postType, $locale) {
            return $this->findBySlug($slug, $locale, function ($query) use ($postType) {
                if ($postType) {
                    $query->whereHas('postType', fn ($q) => $q->where('name', $postType));
                }
            });
        });
    }

    /**
     * Get a published post by slug within one post type (slugs are only unique per type).
     */
    public function getPostBySlugForType(string $slug, PostType $postType, ?string $locale = null): ?Post
    {
        $locale ??= app()->getLocale();

        return $this->remember("type:{$postType->id}:{$locale}:{$slug}", function () use ($slug, $postType, $locale) {
            return $this->findBySlug($slug, $locale, fn ($query) => $query->where('post_type_id', $postType->id));
        });
    }

    /**
     * Invalidate all cached post lookups.
     */
    public function flushCache(): void
    {
        Cache::forever(self::VERSION_KEY, $this->cacheVersion() + 1);
        // Covers quiet saves too (stock changes), which fire no model events
        CachePublicPages::bumpVersion();
    }

    /**
     * @deprecated Use flushCache(); kept for callers that pass a slug.
     */
    public function clearPostCache(?string $slug = null, ?string $postType = null): void
    {
        $this->flushCache();
    }

    /**
     * Get paginated posts with eager loading
     */
    public function getPaginatedPosts(
        int $perPage = 12,
        array $filters = [],
        string $orderBy = 'published_at',
        string $orderDirection = 'desc'
    ): LengthAwarePaginator {
        $query = Post::with([
            'author',
            'postType',
            'taxonomyTerms.taxonomy',
        ]);

        // Apply filters
        if (isset($filters['post_type_id'])) {
            $query->where('post_type_id', $filters['post_type_id']);
        }

        if (isset($filters['taxonomy_term_id'])) {
            $query->whereHas('taxonomyTerms', function ($q) use ($filters) {
                $q->where('taxonomy_terms.id', $filters['taxonomy_term_id']);
            });
        }

        // Only published posts for non-authenticated users
        if (! auth()->check()) {
            $query->published();
        }

        return $query->orderBy($orderBy, $orderDirection)
            ->paginate($perPage);
    }

    protected function baseQuery()
    {
        return Post::with([
            'author',
            'postType',
            'taxonomyTerms.taxonomy',
            'parent',
            'children',
            'translations',
        ])->published();
    }

    /**
     * A post by the slug of its translation in this locale, else by its own slug.
     *
     * The sitemap and hreflang links publish /{locale}/.../{translated-slug};
     * matching only posts.slug made every one of those URLs a 404. The
     * translation is tried first so that, in its locale, a translated slug
     * wins over another post that happens to use the same slug by default.
     */
    protected function findBySlug(string $slug, string $locale, \Closure $scope): ?Post
    {
        $translated = $this->baseQuery()
            ->whereHas('translations', fn ($q) => $q->where('locale', $locale)->where('slug', $slug));
        $scope($translated);

        if ($post = $translated->first()) {
            return $post;
        }

        $query = $this->baseQuery()->where('slug', $slug);
        $scope($query);

        return $query->first();
    }

    protected function remember(string $key, \Closure $callback): ?Post
    {
        return Cache::remember(
            'post:v'.$this->cacheVersion().':'.$key,
            self::CACHE_TTL,
            $callback
        );
    }

    protected function cacheVersion(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }
}
