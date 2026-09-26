<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

/**
 * The search and filters of the admin content lists (posts and pages). They
 * run in the query, so they cover every row rather than the loaded page.
 */
class ContentListFilters
{
    /**
     * @return array<string, mixed> the validated filters that are set
     */
    public static function fromRequest(Request $request): array
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:200'],
            'status' => ['nullable', 'in:published,draft,pending,private,archived,scheduled'],
            'author_id' => ['nullable', 'integer'],
            'post_type_id' => ['nullable', 'integer'],
        ]);

        return array_filter($filters, fn ($value) => $value !== null && $value !== '');
    }

    /**
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<TModel>
     */
    public static function apply(Builder $query, array $filters): Builder
    {
        if (isset($filters['search'])) {
            $term = '%'.mb_strtolower((string) $filters['search']).'%';
            $query->where(fn ($q) => $q->whereRaw('LOWER(title) LIKE ?', [$term])->orWhereRaw('LOWER(slug) LIKE ?', [$term]));
        }

        // "Scheduled" is not a stored status: published with a date still to come
        if (($filters['status'] ?? null) === 'scheduled') {
            $query->where('status', 'published')->where('published_at', '>', now());
        } elseif (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['author_id'])) {
            $query->where('author_id', $filters['author_id']);
        }

        if (isset($filters['post_type_id'])) {
            $query->where('post_type_id', $filters['post_type_id']);
        }

        return $query;
    }
}
