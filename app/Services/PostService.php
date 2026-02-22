<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class PostService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    protected const CACHE_TTL = 3600;

    /**
     * Get a post by slug with all necessary relationships
     */
    public function getPostBySlug(string $slug, string $postType = null): ?Post
    {
        $cacheKey = "post:{$slug}" . ($postType ? ":{$postType}" : '');

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($slug, $postType) {
            $query = Post::with([
                'author',
                'postType',
                'taxonomyTerms.taxonomy',
                'parent',
                'children',
                'allComments' => function ($query) {
                    $query->with('user');
                },
                'translations',
            ]);

            if ($postType) {
                $query->whereHas('postType', function($q) use ($postType) {
                    $q->where('name', $postType);
                });
            }

            return $query->where('slug', $slug)
                ->published()
                ->first();
        });
    }

    /**
     * Clear cache for a specific post
     */
    public function clearPostCache(string $slug, string $postType = null): void
    {
        $cacheKey = "post:{$slug}" . ($postType ? ":{$postType}" : '');
        Cache::forget($cacheKey);
        Cache::forget("post:{$slug}");
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
            'taxonomyTerms.taxonomy'
        ]);

        // Apply filters
        if (isset($filters['post_type_id'])) {
            $query->where('post_type_id', $filters['post_type_id']);
        }

        if (isset($filters['taxonomy_term_id'])) {
            $query->whereHas('taxonomyTerms', function($q) use ($filters) {
                $q->where('taxonomy_terms.id', $filters['taxonomy_term_id']);
            });
        }

        // Only published posts for non-authenticated users
        if (!auth()->check()) {
            $query->published();
        }

        return $query->orderBy($orderBy, $orderDirection)
            ->paginate($perPage);
    }
}
