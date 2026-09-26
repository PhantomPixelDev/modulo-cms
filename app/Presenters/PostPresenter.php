<?php

namespace App\Presenters;

use App\Models\Comment;
use App\Models\Locale;
use App\Models\Post;
use App\Models\SiteSetting;
use App\Services\HtmlSanitizer;
use App\Services\ResponsiveImages;
use App\Services\ShortcodeService;
use App\Services\SiteSettingsService;
use App\Support\CustomFields;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class PostPresenter
{
    /**
     * @param  bool  $full  false for list views: skips rendering content, comments and
     *                      localizations, which archive/search templates never use
     */
    public function presentPost(Post $post, bool $full = true): array
    {
        $content = $full ? $this->renderContent($post) : '';
        $settings = app(SiteSettingsService::class);
        $commentsEnabled = $full && $this->commentsEnabled($post);

        return [
            'id' => $post->id ?? 0,
            'title' => $post->title ?? '',
            'slug' => $post->slug ?? '',
            'content' => $content,
            'excerpt' => $post->excerpt ?? '',
            'featured_image' => $post->featured_image,
            // Smaller WebP copies when the image comes from the media library
            'featured_image_srcset' => app(ResponsiveImages::class)->srcset($post->featured_image),
            'featured_image_alt' => app(ResponsiveImages::class)->alt($post->featured_image),
            'published_at' => $settings->formatDateTime($post->published_at),
            'updated_at' => $settings->formatDateTime($post->updated_at),
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
            // What the theme puts in <head>: search and social previews.
            'seo' => $this->seo($post),
            // Never expose emails on public pages
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name ?? 'Unknown',
            ] : [
                'id' => 0,
                'name' => 'Unknown',
            ],
            'post_type' => $post->postType ? [
                'id' => $post->postType->id,
                'name' => $post->postType->name ?? 'post',
                'label' => $post->postType->label ?? 'Post',
                'slug' => $post->postType->slug ?? 'post',
                'route_prefix' => $post->postType->route_prefix ?? 'posts',
            ] : [
                'id' => 0,
                'name' => 'post',
                'label' => 'Post',
                'slug' => 'post',
                'route_prefix' => 'posts',
            ],
            'terms' => $post->taxonomyTerms ? $post->taxonomyTerms->map(function ($term) {
                return [
                    'id' => $term->id ?? 0,
                    'name' => $term->name ?? '',
                    'slug' => $term->slug ?? '',
                    'taxonomy' => $term->taxonomy ? [
                        'name' => $term->taxonomy->name ?? '',
                        'label' => $term->taxonomy->label ?? '',
                    ] : [
                        'name' => '',
                        'label' => '',
                    ],
                ];
            })->toArray() : [],
            'comments' => $commentsEnabled ? $this->presentComments($post) : [],
            'allow_comments' => $commentsEnabled,
            // The post type's custom fields, by key
            'fields' => CustomFields::values($post),
            'localizations' => $full ? $this->buildLocalizationMap($post) : [],
        ];
    }

    /**
     * Render stored content (Slate JSON or HTML) to safe HTML with shortcodes expanded.
     */
    public function renderContent(Post $post): string
    {
        $content = $post->content ?? '';
        $isSlate = false;

        if (is_string($content) && str_starts_with(trim($content), '[')) {
            try {
                $slateContent = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($slateContent)) {
                    $content = $this->slateToHtml($slateContent);
                    $isSlate = true;
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to parse Slate.js content', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Slate output is escaped while rendering; raw HTML must be sanitized
        // before shortcodes inject their own trusted markup.
        if (is_string($content) && ! $isSlate) {
            $content = app(HtmlSanitizer::class)->sanitize($content);
        }

        if (is_string($content)) {
            try {
                $content = app(ShortcodeService::class)->parse($content);
            } catch (\Throwable $e) {
                \Log::warning('Failed to parse shortcodes', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return is_string($content) ? $this->lazyImages($content) : '';
    }

    /**
     * Images in the body load when scrolled near, unless the author set loading.
     * Runs on sanitized output, so it only ever adds an attribute to <img>.
     */
    protected function lazyImages(string $html): string
    {
        return (string) preg_replace('/<img(?![^>]*\bloading=)(\s[^>]*)?>/i', '<img loading="lazy" decoding="async"$1>', $html);
    }

    /**
     * @return array{data: array<int, array>, pagination: array}
     */
    public function presentPaginator(LengthAwarePaginator $posts): array
    {
        // One query for every card image on the page
        app(ResponsiveImages::class)->preload(array_map(fn ($post) => $post->featured_image ?? null, $posts->items()));

        $data = $posts->getCollection()->map(function ($post) {
            return $this->presentPost($post, full: false);
        })->toArray();

        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
                'prev_page_url' => $posts->previousPageUrl(),
                'next_page_url' => $posts->nextPageUrl(),
            ],
        ];
    }

    protected function sanitizeUrl(string $url): string
    {
        $dangerous_protocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
        $url = trim($url);

        foreach ($dangerous_protocols as $protocol) {
            if (stripos($url, $protocol) === 0) {
                return '#';
            }
        }

        if (! empty($url) && ! preg_match('/^(https?:\/\/|mailto:|tel:|\/|#)/', $url)) {
            return '#';
        }

        return htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    }

    protected function sanitizeAttribute(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    protected function slateToHtml(array $nodes): string
    {
        $html = '';

        foreach ($nodes as $node) {
            if (isset($node['text'])) {
                $text = htmlspecialchars($node['text'], ENT_QUOTES, 'UTF-8');

                if (! empty($node['bold'])) {
                    $text = "<strong>$text</strong>";
                }
                if (! empty($node['italic'])) {
                    $text = "<em>$text</em>";
                }
                if (! empty($node['underline'])) {
                    $text = "<u>$text</u>";
                }
                if (! empty($node['code'])) {
                    $text = "<code>$text</code>";
                }

                $html .= $text;
            } elseif (isset($node['children'])) {
                $children = $this->slateToHtml($node['children']);

                switch ($node['type'] ?? 'paragraph') {
                    case 'heading-one':
                        $html .= "<h1>$children</h1>";
                        break;
                    case 'heading-two':
                        $html .= "<h2>$children</h2>";
                        break;
                    case 'heading-three':
                        $html .= "<h3>$children</h3>";
                        break;
                    case 'heading-four':
                        $html .= "<h4>$children</h4>";
                        break;
                    case 'heading-five':
                        $html .= "<h5>$children</h5>";
                        break;
                    case 'heading-six':
                        $html .= "<h6>$children</h6>";
                        break;
                    case 'block-quote':
                        $html .= "<blockquote>$children</blockquote>";
                        break;
                    case 'bulleted-list':
                        $html .= "<ul>$children</ul>";
                        break;
                    case 'numbered-list':
                        $html .= "<ol>$children</ol>";
                        break;
                    case 'list-item':
                        $html .= "<li>$children</li>";
                        break;
                    case 'link':
                        $url = $this->sanitizeUrl($node['url'] ?? '#');
                        $title = isset($node['title']) ? ' title="'.$this->sanitizeAttribute($node['title']).'"' : '';
                        $target = ! empty($node['target']) && $node['target'] === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
                        $html .= "<a href=\"$url\"$title$target>$children</a>";
                        break;
                    case 'image':
                        $url = $this->sanitizeUrl($node['url'] ?? '');
                        $alt = $this->sanitizeAttribute($node['alt'] ?? '');
                        $title = isset($node['title']) ? ' title="'.$this->sanitizeAttribute($node['title']).'"' : '';
                        $html .= "<img src=\"$url\" alt=\"$alt\"$title loading=\"lazy\" />";
                        break;
                    case 'code-block':
                        $html .= "<pre><code>$children</code></pre>";
                        break;
                    case 'horizontal-rule':
                        $html .= '<hr />';
                        break;
                    default:
                        $html .= "<p>$children</p>";
                }
            }
        }

        return $html;
    }

    public function presentComments(Post $post): array
    {
        $comments = $post->allComments ?? collect();

        if (! $comments instanceof Collection) {
            $comments = collect($comments);
        }

        $grouped = $comments
            ->sortBy('created_at')
            ->groupBy(function (Comment $comment) {
                return $comment->parent_id ?? 'root';
            });

        return $this->buildCommentBranch($grouped, 'root');
    }

    protected function buildCommentBranch(Collection $grouped, int|string $parentKey): array
    {
        $branch = [];
        $children = $grouped->get($parentKey, collect());

        foreach ($children as $comment) {
            $branch[] = $this->formatComment($comment, $grouped);
        }

        return $branch;
    }

    protected function formatComment(Comment $comment, Collection $grouped): array
    {
        return [
            'id' => $comment->id,
            'user_id' => $comment->user_id,
            'author_name' => $comment->author_name,
            'author_avatar' => $comment->author_avatar,
            'content' => $comment->content,
            'created_at' => optional($comment->created_at)->toIso8601String(),
            'replies' => $this->buildCommentBranch($grouped, $comment->id),
        ];
    }

    protected function commentsEnabled(Post $post): bool
    {
        $global = SiteSetting::get('enable_comments', true);
        if (! $global) {
            return false;
        }

        return (bool) ($post->postType?->has_comments ?? false);
    }

    protected function buildLocalizationMap(Post $post): array
    {
        $localizations = [];
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', config('app.locale', 'en'));

        $localizations[$defaultLocale] = [
            'slug' => $post->slug,
            'path' => $this->buildContentPath($post, $post->slug),
        ];

        $translations = $post->relationLoaded('translations')
            ? $post->translations
            : $post->translations()->get();

        foreach ($translations as $translation) {
            if (! $translation->slug) {
                continue;
            }

            $localizations[$translation->locale] = [
                'slug' => $translation->slug,
                'path' => $this->buildContentPath($post, $translation->slug),
            ];
        }

        return array_filter($localizations, fn ($entry) => ! empty($entry['path']));
    }

    /**
     * @return array{title: string, description: string, image: string|null, canonical: string|null, noindex: bool}
     */
    protected function seo(Post $post): array
    {
        $meta = is_array($post->meta_data) ? $post->meta_data : [];
        $safeUrl = fn ($value) => is_string($value) && preg_match('#^(https?://|/)#i', $value) === 1 ? $value : null;

        return [
            'title' => (string) ($post->meta_title ?: $post->title),
            'description' => (string) ($post->meta_description ?: $post->excerpt ?: ''),
            'image' => $safeUrl($meta['og_image'] ?? null) ?? $post->featured_image,
            'canonical' => $safeUrl($meta['canonical_url'] ?? null),
            'noindex' => filter_var($meta['noindex'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];
    }

    protected function buildContentPath(Post $post, ?string $slug): string
    {
        $segments = [];
        $prefix = $post->postType?->route_prefix;

        if ($prefix && $prefix !== '/') {
            $segments[] = trim($prefix, '/');
        }

        if ($slug) {
            $segments[] = trim($slug, '/');
        }

        if (empty($segments)) {
            return '/';
        }

        return '/'.implode('/', $segments);
    }
}
