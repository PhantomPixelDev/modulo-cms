<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\Template;
use App\Services\ThemeManager;
use App\Services\MenuService;
use Illuminate\Support\Facades\View;
use App\Services\ReactTemplateRenderer;

class TemplateRenderingService
{
    protected ThemeManager $themeManager;
    protected MenuService $menuService;
    protected ReactTemplateRenderer $reactRenderer;

    public function __construct(ThemeManager $themeManager, MenuService $menuService, ReactTemplateRenderer $reactRenderer)
    {
        $this->themeManager = $themeManager;
        $this->menuService = $menuService;
        $this->reactRenderer = $reactRenderer;
    }

    /**
     * Render a taxonomy archive (e.g., tag/category pages) using theme templates when available.
     */
    public function renderTaxonomyArchive($posts, Taxonomy $taxonomy, TaxonomyTerm $term)
    {
        $data = [
            'taxonomy' => $taxonomy,
            'term' => $term,
            'posts' => $posts,
            'title' => ($taxonomy->label ?: ucfirst($taxonomy->slug)) . ': ' . $term->name,
            'meta_description' => $term->description ?? '',
        ];
        $data = array_merge($data, $this->buildSeoForTaxonomy($taxonomy, $term));

        // React-only: render the archive component defined in theme.json
        return $this->reactRenderer
            ->render('archive', $data)
            ->toResponse(request())
            ->getContent();
    }

    public function renderPost(Post $post, array $additionalData = [])
    {
        $data = array_merge([
            'post' => $post,
            'post_type' => $post->postType,
            'title' => $post->title,
            'meta_description' => $post->excerpt ?? '',
        ], $additionalData, $this->buildSeoForPost($post));

        return $this->reactRenderer
            ->render('post', $data)
            ->toResponse(request())
            ->getContent();
    }

    public function renderPage(Post $page, array $additionalData = [])
    {
        $data = array_merge([
            'page' => $page,
            'post' => $page, // alias if components expect `post`
            'title' => $page->title,
            'meta_description' => $page->excerpt ?? '',
        ], $additionalData, $this->buildSeoForPage($page));

        return $this->reactRenderer
            ->render('page', $data)
            ->toResponse(request())
            ->getContent();
    }

    public function renderIndex($posts, PostType $postType = null, array $additionalData = [])
    {
        $data = array_merge([
            'posts' => $posts,
            'post_type' => $postType,
            'title' => $additionalData['title'] ?? ($postType?->plural_label ?? config('app.name', 'CMS')),
            'meta_description' => $additionalData['description'] ?? ($postType?->description ?? ''),
        ], $additionalData, $this->buildSeoForIndex($postType, $additionalData));

        // Use the "posts" or "index" template from the React theme. Prefer "posts" for listings.
        $templateName = 'posts';
        return $this->reactRenderer
            ->render($templateName, $data)
            ->toResponse(request())
            ->getContent();
    }

    public function renderLayout(string $content, array $data = [])
    {
        // React-only path does not use Blade layouts. If needed, implement a React layout component.
        // For backward compatibility, simply return the provided content.
        return $content;
    }

    private function getPostData(Post $post)
    {
        return [
            'title' => $post->title,
            'content' => $post->content,
            'excerpt' => $post->excerpt,
            'featured_image' => $post->featured_image ? '<img src="' . $post->featured_image . '" alt="' . $post->title . '" class="w-full h-64 object-cover mb-6">' : '',
            'published_at' => $post->published_at?->format('F j, Y'),
            'published_at_iso' => $post->published_at?->toISOString(),
            'updated_at' => $post->updated_at->format('F j, Y'),
            'updated_at_iso' => $post->updated_at->toISOString(),
            'view_count' => $post->view_count ?? 0,
            'read_time' => $this->calculateReadTime($post->content),
            'author_name' => $post->author?->name ?? 'Unknown',
            'author_avatar' => $post->author?->avatar ?? '/images/default-avatar.png',
            'author_role' => $post->author?->roles?->first()?->name ?? 'Author',
            'taxonomy_terms' => $this->renderTaxonomyTerms($post->taxonomyTerms),
            'share_buttons' => $this->renderShareButtons($post),
            'related_posts' => '',
            'comments' => '',
        ];
    }

    private function getPageData(Post $page)
    {
        return [
            'title' => $page->title,
            'content' => $page->content,
            'excerpt' => $page->excerpt,
            'featured_image' => $page->featured_image ? '<img src="' . $page->featured_image . '" alt="' . $page->title . '" class="w-full h-64 object-cover mb-6">' : '',
            'updated_at' => $page->updated_at->format('F j, Y'),
            'updated_at_iso' => $page->updated_at->toISOString(),
            'breadcrumbs' => '',
            'child_pages' => '',
            'contact_form' => '',
        ];
    }

    private function getIndexData($posts, PostType $postType = null)
    {
        return [
            'page_title' => $postType ? $postType->plural_label : 'Latest Posts',
            'page_description' => $postType ? $postType->description : 'Browse our latest content',
            'hero_cta' => '',
            'featured_content' => '',
            'posts' => $posts,
            'pagination' => '',
            'sidebar' => '',
        ];
    }

    private function getHeaderData()
    {
        $menu = $this->menuService->getMenuByLocation('header');
        if (!$menu) {
            throw new \RuntimeException("Header menu location 'header' not found or has no items");
        }
        \Log::info('flexia.header.menu', [
            'menu_id' => $menu->id ?? null,
            'menu_name' => $menu->name ?? null,
            'items_count' => $menu?->items?->count() ?? null,
        ]);
        $navigation = $this->menuService->renderMenuHtml($menu, [
            'id' => 'primary-menu',
            'class' => 'menu',
            'wrap' => false,
        ]);

        return [
            'site_name' => config('app.name', 'CMS'),
            'logo_url' => '/images/logo.png',
            'navigation_menu' => $navigation,
            'search_box' => '<input type="search" placeholder="Search..." class="px-3 py-1 border rounded">',
            'user_menu' => '',
        ];
    }

    private function getFooterData()
    {
        $menu = $this->menuService->getMenuByLocation('footer');
        if (!$menu) {
            throw new \RuntimeException("Footer menu location 'footer' not found or has no items");
        }
        \Log::info('flexia.footer.menu', [
            'menu_id' => $menu->id ?? null,
            'menu_name' => $menu->name ?? null,
            'items_count' => $menu?->items?->count() ?? null,
        ]);
        $footerLinks = $this->menuService->renderMenuHtml($menu, [
            'class' => 'menu',
            'wrap' => false,
        ]);

        return [
            'site_name' => config('app.name', 'CMS'),
            'site_description' => 'A powerful content management system',
            'current_year' => date('Y'),
            'social_links' => '',
            'footer_links' => $footerLinks,
            'contact_info' => '',
            'footer_extra' => '',
        ];
    }

    /**
     * Build SEO data for a post (article type)
     */
    private function buildSeoForPost(Post $post): array
    {
        $title = $post->meta_title ?: $post->title;
        $description = $post->meta_description ?: ($post->excerpt ?? '');
        $url = $this->canonicalUrlForPost($post);
        $image = $post->featured_image ?: '';

        return [
            'meta_title' => $title,
            'meta_description' => $description,
            'canonical_url' => $url,
            'og_title' => $title,
            'og_description' => $description,
            'og_type' => 'article',
            'og_image' => $image,
            'og_url' => $url,
            'og_site_name' => config('app.name', 'CMS'),
            'twitter_card' => $image ? 'summary_large_image' : 'summary',
            'twitter_title' => $title,
            'twitter_description' => $description,
            'twitter_image' => $image,
        ];
    }

    /**
     * Build SEO data for a page (website type)
     */
    private function buildSeoForPage(Post $page): array
    {
        $title = $page->meta_title ?: $page->title;
        $description = $page->meta_description ?: ($page->excerpt ?? '');
        $url = $this->canonicalUrlForPost($page);
        $image = $page->featured_image ?: '';

        return [
            'meta_title' => $title,
            'meta_description' => $description,
            'canonical_url' => $url,
            'og_title' => $title,
            'og_description' => $description,
            'og_type' => 'website',
            'og_image' => $image,
            'og_url' => $url,
            'og_site_name' => config('app.name', 'CMS'),
            'twitter_card' => $image ? 'summary_large_image' : 'summary',
            'twitter_title' => $title,
            'twitter_description' => $description,
            'twitter_image' => $image,
        ];
    }

    /**
     * Build SEO data for an index/archive listing
     */
    private function buildSeoForIndex(PostType $postType = null, array $additionalData = []): array
    {
        $title = $additionalData['title'] ?? ($postType?->plural_label ?? config('app.name', 'CMS'));
        $description = $additionalData['description'] ?? ($postType?->description ?? '');
        // Canonical selection precedence: explicit canonical_url > basePath > prefer_index(home) > postType index
        if (!empty($additionalData['canonical_url'])) {
            $url = $additionalData['canonical_url'];
        } elseif (!empty($additionalData['basePath'])) {
            $url = url($additionalData['basePath']);
        } elseif (!empty($additionalData['prefer_index'])) {
            $url = url('/');
        } else {
            $url = $this->canonicalUrlForIndex($postType);
        }

        return [
            'meta_title' => $title,
            'meta_description' => $description,
            'canonical_url' => $url,
            'og_title' => $title,
            'og_description' => $description,
            'og_type' => 'website',
            'og_url' => $url,
            'og_site_name' => config('app.name', 'CMS'),
            'twitter_card' => 'summary',
            'twitter_title' => $title,
            'twitter_description' => $description,
        ];
    }

    /**
     * Build SEO data for taxonomy term archive
     */
    private function buildSeoForTaxonomy(Taxonomy $taxonomy, TaxonomyTerm $term): array
    {
        $title = ($taxonomy->label ?: ucfirst($taxonomy->slug)) . ': ' . $term->name;
        $description = $term->description ?? '';
        $url = url('/' . trim($taxonomy->slug, '/') . '/' . $term->slug);

        return [
            'meta_title' => $title,
            'meta_description' => $description,
            'canonical_url' => $url,
            'og_title' => $title,
            'og_description' => $description,
            'og_type' => 'website',
            'og_url' => $url,
            'og_site_name' => config('app.name', 'CMS'),
            'twitter_card' => 'summary',
            'twitter_title' => $title,
            'twitter_description' => $description,
        ];
    }

    /**
     * Helpers to compute canonical URLs
     */
    private function canonicalUrlForPost(Post $post): string
    {
        $prefix = $post->postType?->route_prefix;
        $prefix = ($prefix === null || $prefix === '' || $prefix === '/') ? '' : '/' . ltrim($prefix, '/');
        return url($prefix . '/' . ltrim((string)$post->slug, '/'));
    }

    private function canonicalUrlForIndex(PostType $postType = null): string
    {
        if ($postType && !in_array(($postType->route_prefix ?? null), [null, '', '/'], true)) {
            return url('/' . ltrim((string)$postType->route_prefix, '/'));
        }
        // Generic posts index fallback
        return url('/posts');
    }

    private function calculateReadTime(string $content)
    {
        $wordCount = str_word_count(strip_tags($content));
        return max(1, round($wordCount / 200)); // Assuming 200 words per minute
    }

    private function renderTaxonomyTerms($terms)
    {
        if (!$terms || $terms->isEmpty()) {
            return '';
        }

        $html = '<div class="flex flex-wrap gap-2 mt-4">';
        foreach ($terms as $term) {
            $html .= '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">' . $term->name . '</span>';
        }
        $html .= '</div>';

        return $html;
    }

    private function renderShareButtons(Post $post)
    {
        $prefix = $post->postType?->route_prefix;
        $prefix = ($prefix === null || $prefix === '' || $prefix === '/') ? '' : '/' . ltrim($prefix, '/');
        $url = url($prefix . '/' . $post->slug);
        return '<div class="flex space-x-2">
            <a href="https://twitter.com/intent/tweet?url=' . urlencode($url) . '&text=' . urlencode($post->title) . '" class="text-blue-500 hover:text-blue-700">Share on Twitter</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=' . urlencode($url) . '" class="text-blue-500 hover:text-blue-700">Share on Facebook</a>
        </div>';
    }
}
