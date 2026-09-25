<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Post;
use App\Presenters\PostPresenter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A post or page as the v1 API returns it. Listings leave the body out;
 * a single item carries it rendered (shortcodes applied, HTML sanitized).
 *
 * @mixin Post
 */
class PostResource extends JsonResource
{
    protected bool $withContent = false;

    public function withContent(bool $withContent = true): static
    {
        $this->withContent = $withContent;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Post $post */
        $post = $this->resource;
        $meta = is_array($post->meta_data) ? $post->meta_data : [];

        return [
            'id' => $post->id,
            'type' => $post->postType?->name,
            'title' => $post->title,
            'slug' => $post->slug,
            'url' => url($post->publicPath()),
            'status' => $post->status,
            'excerpt' => $post->excerpt,
            'content' => $this->when($this->withContent, fn () => app(PostPresenter::class)->renderContent($post)),
            'featured_image' => $post->featured_image,
            'published_at' => $post->published_at?->toIso8601String(),
            'updated_at' => $post->updated_at?->toIso8601String(),
            'author' => $post->author !== null ? ['id' => $post->author->id, 'name' => $post->author->name] : null,
            'terms' => $post->relationLoaded('taxonomyTerms')
                ? $post->taxonomyTerms->map(fn ($term) => [
                    'id' => $term->id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'taxonomy' => $term->taxonomy?->name,
                ])->values()
                : [],
            'seo' => [
                'title' => $post->meta_title ?: $post->title,
                'description' => $post->meta_description ?: $post->excerpt,
                'noindex' => filter_var($meta['noindex'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ],
        ];
    }
}
