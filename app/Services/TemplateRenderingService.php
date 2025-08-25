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

class TemplateRenderingService
{
    protected ThemeManager $themeManager;
    protected MenuService $menuService;

    public function __construct(ThemeManager $themeManager, MenuService $menuService)
    {
        $this->themeManager = $themeManager;
        $this->menuService = $menuService;
    }

    /**
     * Render a taxonomy archive (e.g., tag/category pages) using theme templates when available.
     */
    public function renderTaxonomyArchive($posts, Taxonomy $taxonomy, TaxonomyTerm $term)
    {
        $common = [
            'assets' => $this->themeManager->getAssets(),
            'site_name' => config('app.name', 'CMS'),
            'title' => ($taxonomy->label ?: ucfirst($taxonomy->slug)) . ': ' . $term->name,
            'meta_description' => $term->description ?? '',
        ];
        $data = array_merge([
            'taxonomy' => $taxonomy,
            'term' => $term,
            'posts' => $posts,
        ], $common, $this->buildSeoForTaxonomy($taxonomy, $term));

        $themeData = array_merge($data, $this->getHeaderData(), $this->getFooterData());
        // Try specific templates first, then generic archive
        $candidates = [];
        $slug = trim((string)($taxonomy->slug ?? ''));
        if ($slug !== '') {
            $candidates[] = $slug;      // e.g. 'tag' or 'category'
        }
        $candidates[] = 'archive';

        foreach ($candidates as $tpl) {
            $themeTemplate = $this->themeManager->renderTemplate($tpl, $themeData);
            if ($themeTemplate) {
                if ($this->isFullHtmlDocument($themeTemplate)) {
                    return $themeTemplate;
                }
                return $this->renderLayout($themeTemplate, $data);
            }
        }

        // Fallback to index renderer with contextual title
        return $this->renderIndex($posts, null, [
            'title' => $common['title'],
            'description' => $common['meta_description'],
        ]);
    }

    /**
     * Detect if a rendered string is a complete HTML document
     */
    private function isFullHtmlDocument(string $html): bool
    {
        $snippet = substr(ltrim($html), 0, 500);
        return stripos($snippet, '<!DOCTYPE') !== false || stripos($snippet, '<html') !== false;
    }

    public function renderPost(Post $post, array $additionalData = [])
    {
        // Provide common variables expected by layouts (assets, site info)
        $common = [
            'assets' => $this->themeManager->getAssets(),
            'site_name' => config('app.name', 'CMS'),
            'title' => $post->title,
            'meta_description' => $post->excerpt ?? '',
        ];
        $data = array_merge([
            // Provide objects expected by theme templates
            'post' => $post,
        ], $this->getPostData($post), $common, $additionalData, $this->buildSeoForPost($post));
        
        // Try theme template first (inject header/footer so layout partials have data)
        \Log::info('renderPost:attemptThemeTemplate', ['postId' => $post->id, 'slug' => $post->slug]);
        $themeData = array_merge($data, $this->getHeaderData(), $this->getFooterData());
        $themeTemplate = $this->themeManager->renderTemplate('post', $themeData);
        if ($themeTemplate) {
            \Log::info('renderPost:usingThemeTemplate');
            if ($this->isFullHtmlDocument($themeTemplate)) {
                return $themeTemplate;
            }
            return $this->renderLayout($themeTemplate, $data);
        }
        \Log::warning('renderPost:themeTemplateMissingOrError, falling back');
        
        // Fallback to database templates
        $postType = $post->postType;
        $template = $postType->singleTemplate ?? Template::ofType('post')->default()->first();
        
        if (!$template) {
            $template = Template::ofType('post')->active()->first();
        }

        if ($template) {
            \Log::info('renderPost:usingDbTemplate', ['templateId' => $template->id ?? null]);
            return $template->renderWithData($data);
        }
        throw new \RuntimeException('No template available to render post');
    }

    public function renderPage(Post $page, array $additionalData = [])
    {
        $common = [
            'assets' => $this->themeManager->getAssets(),
            'site_name' => config('app.name', 'CMS'),
            'title' => $page->title,
            'meta_description' => $page->excerpt ?? '',
        ];
        $data = array_merge([
            // Provide objects expected by theme templates
            'page' => $page,
            // Also provide 'post' alias for backward compatibility with templates using $post
            'post' => $page,
        ], $this->getPageData($page), $common, $additionalData, $this->buildSeoForPage($page));
        
        // Try theme templates in order of specificity:
        // 1) pages/{slug}.blade.php
        // 2) {slug}.blade.php
        // 3) page.blade.php (generic)
        $slug = trim((string) $page->slug);
        $candidates = [];
        if ($slug !== '') {
            $candidates[] = 'pages/' . $slug; // e.g. resources/themes/<active>/templates/pages/about.blade.php
            $candidates[] = $slug;            // e.g. resources/themes/<active>/templates/about.blade.php
        }
        $candidates[] = 'page';               // fallback generic page template

        foreach ($candidates as $tpl) {
            $themeData = array_merge($data, $this->getHeaderData(), $this->getFooterData());
            $themeTemplate = $this->themeManager->renderTemplate($tpl, $themeData);
            if ($themeTemplate) {
                if ($this->isFullHtmlDocument($themeTemplate)) {
                    return $themeTemplate;
                }
                return $this->renderLayout($themeTemplate, $data);
            }
        }
        
        // Fallback to database templates
        $postType = $page->postType;
        $template = $postType->singleTemplate ?? Template::ofType('page')->default()->first();
        
        if (!$template) {
            $template = Template::ofType('page')->active()->first();
        }

        if ($template) {
            return $template->renderWithData($data);
        }
        throw new \RuntimeException('No template available to render page');
    }

    public function renderIndex($posts, PostType $postType = null, array $additionalData = [])
    {
        $common = [
            'assets' => $this->themeManager->getAssets(),
            'site_name' => config('app.name', 'CMS'),
            'title' => $additionalData['title'] ?? ($postType?->plural_label ?? config('app.name', 'CMS')),
            'meta_description' => $additionalData['description'] ?? ($postType?->description ?? ''),
        ];
        $data = array_merge($this->getIndexData($posts, $postType), $common, $additionalData, $this->buildSeoForIndex($postType, $additionalData));
        
        // Dynamic per post type: {route_prefix} -> index
        $themeData = array_merge($data, $this->getHeaderData(), $this->getFooterData());
        $candidates = [];
        if ($postType && !in_array(($postType->route_prefix ?? null), [null, '', '/'], true)) {
            $prefix = ltrim((string) $postType->route_prefix, '/');
            if ($prefix !== '') {
                $candidates[] = $prefix;
            }
        }
        $candidates[] = 'index';

        \Log::info('TemplateRenderingService:renderIndex:candidates', [
            'postTypeId' => $postType?->id,
            'route_prefix' => $postType?->route_prefix,
            'candidates' => $candidates,
        ]);

        foreach ($candidates as $tpl) {
            \Log::info('TemplateRenderingService:renderIndex:try', ['template' => $tpl]);
            $themeTemplate = $this->themeManager->renderTemplate($tpl, $themeData);
            if ($themeTemplate) {
                \Log::info('TemplateRenderingService:renderIndex:using', ['template' => $tpl]);
                if ($this->isFullHtmlDocument($themeTemplate)) {
                    return $themeTemplate;
                }
                return $this->renderLayout($themeTemplate, $data);
            }
        }
        \Log::warning('TemplateRenderingService:renderIndex:noThemeTemplateMatch');
        
        // Fallback to database templates
        $template = $postType?->archiveTemplate ?? Template::ofType('index')->default()->first();
        
        if (!$template) {
            $template = Template::ofType('index')->active()->first();
        }

        if ($template) {
            \Log::info('TemplateRenderingService:renderIndex:usingDbTemplate', ['templateId' => $template->id ?? null]);
            return $template->renderWithData($data);
        }
        throw new \RuntimeException('No template available to render index');
    }

    public function renderLayout(string $content, array $data = [])
    {
        // First try theme-provided layout
        // IMPORTANT: Merge order ensures the rendered fragment ($content) wins over any
        // 'content' key present in $data (like post body). Otherwise the layout would
        // print only the raw body and drop the template markup (H1, image, etc.).
        $layoutData = array_merge($data, [
            'content' => $content,
            'header' => $this->renderHeader($data),
            'footer' => $this->renderFooter($data),
        ]);

        // Inject common defaults and theme asset URLs expected by theme layouts
        $activeTheme = $this->themeManager->getActiveTheme();
        $assets = $this->themeManager->getAssets();
        $css = $assets['css'] ?? [];
        $js = $assets['js'] ?? [];

        $layoutData = array_merge([
            'site_language' => config('app.locale', 'en'),
            'site_name' => $layoutData['site_name'] ?? config('app.name', 'CMS'),
            'page_title' => $layoutData['page_title'] ?? ($layoutData['title'] ?? ''),
            'meta_description' => $layoutData['meta_description'] ?? ($layoutData['description'] ?? ''),
            'body_classes' => $layoutData['body_classes'] ?? '',
            'extra_head' => $layoutData['extra_head'] ?? '',
            'extra_scripts' => $layoutData['extra_scripts'] ?? '',
            // Provide the entire assets array for Blade layouts like themes.modern
            'assets' => $assets,
            'theme_css_url' => is_array($css) && count($css) > 0 ? $css[0] : (is_string($css) ? $css : ''),
            'theme_responsive_css_url' => is_array($css) && count($css) > 1 ? $css[1] : '',
            'theme_js_url' => is_array($js) && count($js) > 0 ? $js[0] : (is_string($js) ? $js : ''),
            'favicon_url' => (function () use ($activeTheme) {
                if (!$activeTheme) return '';
                $images = $activeTheme->assets['images'] ?? [];
                if (isset($images['favicon'])) {
                    return asset('themes/' . $activeTheme->directory_path . '/' . $images['favicon']);
                }
                return '';
            })(),
        ], $layoutData);

        // Also expose header/footer variables to the layout so Blade includes can use them
        $layoutData = array_merge($layoutData, $this->getHeaderData(), $this->getFooterData());

        $themeLayout = $this->themeManager->renderTemplate('layout', $layoutData);
        if ($themeLayout) {
            return $themeLayout;
        }

        // Fallback to database layout templates
        $template = Template::ofType('layout')->default()->first();
        if (!$template) {
            $template = Template::ofType('layout')->active()->first();
        }

        if ($template) {
            return $template->renderWithData($layoutData);
        }
        throw new \RuntimeException('No layout template available');
    }

    public function renderHeader(array $data = [])
    {
        $headerData = array_merge($this->getHeaderData(), $data);

        // Theme header first
        $themeHeader = $this->themeManager->renderTemplate('header', $headerData);
        if ($themeHeader) {
            return $themeHeader;
        }

        // Fallback to database templates
        $template = Template::ofType('header')->default()->first();
        if (!$template) {
            $template = Template::ofType('header')->active()->first();
        }

        if ($template) {
            return $template->renderWithData($headerData);
        }
        throw new \RuntimeException('No header template available');
    }

    public function renderFooter(array $data = [])
    {
        $footerData = array_merge($this->getFooterData(), $data);

        // Theme footer first
        $themeFooter = $this->themeManager->renderTemplate('footer', $footerData);
        if ($themeFooter) {
            return $themeFooter;
        }

        // Fallback to database templates
        $template = Template::ofType('footer')->default()->first();
        if (!$template) {
            $template = Template::ofType('footer')->active()->first();
        }

        if ($template) {
            return $template->renderWithData($footerData);
        }
        throw new \RuntimeException('No footer template available');
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
        $menu = $this->menuService->getMenuByLocation('primary');
        if (!$menu) {
            throw new \RuntimeException("Header menu location 'primary' not found or has no items");
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

    // Removed: renderNavigationMenu, renderFooterLinks, and all fallback HTML methods.
}
