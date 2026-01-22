<?php

namespace App\Presenters;

use App\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PostPresenter
{
    public function presentPost(Post $post): array
    {
        $content = $post->content ?? '';
        $settings = app(\App\Services\SiteSettingsService::class);

        if (is_string($content) && str_starts_with(trim($content), '[')) {
            try {
                $slateContent = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $content = $this->slateToHtml($slateContent);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to parse Slate.js content', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if (is_string($content)) {
            try {
                $content = app(\App\Services\ShortcodeService::class)->parse($content);
            } catch (\Throwable $e) {
                \Log::warning('Failed to parse shortcodes', [
                    'post_id' => $post->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return [
            'id' => $post->id ?? 0,
            'title' => $post->title ?? '',
            'slug' => $post->slug ?? '',
            'content' => $content,
            'excerpt' => $post->excerpt ?? '',
            'featured_image' => $post->featured_image,
            'published_at' => $settings->formatDateTime($post->published_at),
            'updated_at' => $settings->formatDateTime($post->updated_at),
            'meta_title' => $post->meta_title,
            'meta_description' => $post->meta_description,
            'author' => $post->author ? [
                'id' => $post->author->id,
                'name' => $post->author->name ?? 'Unknown',
                'email' => $post->author->email ?? '',
            ] : [
                'id' => 0,
                'name' => 'Unknown',
                'email' => '',
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
        ];
    }

    /**
     * @return array{data: array<int, array>, pagination: array}
     */
    public function presentPaginator(LengthAwarePaginator $posts): array
    {
        $data = $posts->getCollection()->map(function ($post) {
            return $this->presentPost($post);
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

        if (!empty($url) && !preg_match('/^(https?:\/\/|mailto:|tel:|\/|#)/', $url)) {
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

                if (!empty($node['bold'])) {
                    $text = "<strong>$text</strong>";
                }
                if (!empty($node['italic'])) {
                    $text = "<em>$text</em>";
                }
                if (!empty($node['underline'])) {
                    $text = "<u>$text</u>";
                }
                if (!empty($node['code'])) {
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
                        $title = isset($node['title']) ? ' title="' . $this->sanitizeAttribute($node['title']) . '"' : '';
                        $target = !empty($node['target']) && $node['target'] === '_blank' ? ' target="_blank" rel="noopener noreferrer"' : '';
                        $html .= "<a href=\"$url\"$title$target>$children</a>";
                        break;
                    case 'image':
                        $url = $this->sanitizeUrl($node['url'] ?? '');
                        $alt = $this->sanitizeAttribute($node['alt'] ?? '');
                        $title = isset($node['title']) ? ' title="' . $this->sanitizeAttribute($node['title']) . '"' : '';
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
}
