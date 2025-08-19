<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostType;
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
        ], $this->getPostData($post), $common, $additionalData);
        
        // Try theme template first
        \Log::info('renderPost:attemptThemeTemplate', ['postId' => $post->id, 'slug' => $post->slug]);
        $themeTemplate = $this->themeManager->renderTemplate('post', $data);
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
        \Log::warning('renderPost:usingFallbackHtml');
        return $this->getFallbackPostHtml($post, $data);
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
        ], $this->getPageData($page), $common, $additionalData);
        
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
            $themeTemplate = $this->themeManager->renderTemplate($tpl, $data);
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

        return $template ? $template->renderWithData($data) : $this->getFallbackPageHtml($page, $data);
    }

    public function renderIndex($posts, PostType $postType = null, array $additionalData = [])
    {
        $common = [
            'assets' => $this->themeManager->getAssets(),
            'site_name' => config('app.name', 'CMS'),
            'title' => $additionalData['title'] ?? ($postType?->plural_label ?? config('app.name', 'CMS')),
            'meta_description' => $additionalData['description'] ?? ($postType?->description ?? ''),
        ];
        $data = array_merge($this->getIndexData($posts, $postType), $common, $additionalData);
        
        // Try theme templates in order of specificity for archives/listing pages
        // 1) archives/{route_prefix}.blade.php (e.g., archives/news.blade.php)
        // 2) {route_prefix}.blade.php         (e.g., news.blade.php)
        // 3) posts.blade.php OR index.blade.php depending on prefer_index flag
        //    - When additionalData['prefer_index'] is true (e.g., home page), try index before posts
        //    - Otherwise (e.g., /posts listing), try posts before index
        $candidates = [];
        if ($postType && !in_array(($postType->route_prefix ?? null), [null, '', '/'], true)) {
            $prefix = ltrim((string) $postType->route_prefix, '/');
            if ($prefix !== '') {
                $candidates[] = 'archives/' . $prefix;
                $candidates[] = $prefix;
            }
        }
        $preferIndex = (bool)($additionalData['prefer_index'] ?? false);
        if ($preferIndex) {
            $candidates[] = 'index';
            $candidates[] = 'posts';
        } else {
            $candidates[] = 'posts';
            $candidates[] = 'index';
        }

        \Log::info('TemplateRenderingService:renderIndex:candidates', [
            'postTypeId' => $postType?->id,
            'route_prefix' => $postType?->route_prefix,
            'prefer_index' => $preferIndex,
            'candidates' => $candidates,
        ]);

        foreach ($candidates as $tpl) {
            \Log::info('TemplateRenderingService:renderIndex:try', ['template' => $tpl]);
            $themeTemplate = $this->themeManager->renderTemplate($tpl, $data);
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
        \Log::warning('TemplateRenderingService:renderIndex:usingFallbackHtml');
        return $this->getFallbackIndexHtml($posts, $postType, $data);
    }

    public function renderLayout(string $content, array $data = [])
    {
        // First try theme-provided layout
        $layoutData = array_merge([
            'content' => $content,
            'header' => $this->renderHeader($data),
            'footer' => $this->renderFooter($data),
        ], $data);

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

        return $template ? $template->renderWithData($layoutData) : $this->getFallbackLayoutHtml($content, $layoutData);
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

        return $template ? $template->renderWithData($headerData) : $this->getFallbackHeaderHtml($headerData);
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

        return $template ? $template->renderWithData($footerData) : $this->getFallbackFooterHtml($footerData);
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
        $navigation = '';
        try {
            $navigation = $this->menuService->renderMenuHtml($this->menuService->getMenuByLocation('header'));
        } catch (\Throwable $e) { $navigation = ''; }

        return [
            'site_name' => config('app.name', 'CMS'),
            'logo_url' => '/images/logo.png',
            // Prefer DB-driven menu; fallback to static links
            'navigation_menu' => $navigation !== '' ? $navigation : $this->renderNavigationMenu(),
            'search_box' => '<input type="search" placeholder="Search..." class="px-3 py-1 border rounded">',
            'user_menu' => '',
        ];
    }

    private function getFooterData()
    {
        $footerLinks = '';
        try {
            $footerLinks = $this->menuService->renderMenuHtml($this->menuService->getMenuByLocation('footer'), [ 'class' => 'flex gap-4 justify-center' ]);
        } catch (\Throwable $e) { $footerLinks = ''; }

        return [
            'site_name' => config('app.name', 'CMS'),
            'site_description' => 'A powerful content management system',
            'current_year' => date('Y'),
            'social_links' => '',
            // Provide rendered footer links HTML
            'footer_links' => $footerLinks !== '' ? $footerLinks : $this->renderFooterLinks(),
            'contact_info' => '',
            'footer_extra' => '',
        ];
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
        $url = url('/' . $post->slug);
        return '<div class="flex space-x-2">
            <a href="https://twitter.com/intent/tweet?url=' . urlencode($url) . '&text=' . urlencode($post->title) . '" class="text-blue-500 hover:text-blue-700">Share on Twitter</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=' . urlencode($url) . '" class="text-blue-500 hover:text-blue-700">Share on Facebook</a>
        </div>';
    }

    private function renderNavigationMenu()
    {
        return '<a href="/" class="text-gray-700 hover:text-gray-900 px-3 py-2">Home</a>
                <a href="/posts" class="text-gray-700 hover:text-gray-900 px-3 py-2">Posts</a>';
    }

    private function renderFooterLinks()
    {
        return '<li><a href="/about" class="hover:text-white">About</a></li>
                <li><a href="/contact" class="hover:text-white">Contact</a></li>
                <li><a href="/privacy" class="hover:text-white">Privacy</a></li>';
    }

    // Fallback HTML methods
    private function getFallbackPostHtml(Post $post, array $data)
    {
        return '<article class="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 class="text-3xl font-bold mb-4">' . $data['title'] . '</h1>
            <div class="text-gray-600 mb-6">' . $data['published_at'] . ' by ' . $data['author_name'] . '</div>
            <div class="prose max-w-none">' . $data['content'] . '</div>
        </article>';
    }

    private function getFallbackPageHtml(Post $page, array $data)
    {
        return '<article class="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 class="text-3xl font-bold mb-4">' . $data['title'] . '</h1>
            <div class="prose max-w-none">' . $data['content'] . '</div>
        </article>';
    }

    private function getFallbackIndexHtml($posts, array $data)
    {
        $html = '<div class="max-w-6xl mx-auto">
            <h1 class="text-4xl font-bold mb-8">' . $data['page_title'] . '</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
        
        foreach ($posts as $post) {
            $html .= '<article class="bg-white rounded-lg shadow-sm p-6">
                <h2 class="text-xl font-semibold mb-2"><a href="/' . $post->slug . '">' . $post->title . '</a></h2>
                <p class="text-gray-600">' . $post->excerpt . '</p>
            </article>';
        }
        
        $html .= '</div></div>';
        return $html;
    }

    private function getFallbackLayoutHtml(string $content, array $data)
    {
        return '<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>' . ($data['title'] ?? 'CMS') . '</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50">
            ' . ($data['header'] ?? '') . '
            <main class="container mx-auto px-4 py-8">' . $content . '</main>
            ' . ($data['footer'] ?? '') . '
        </body>
        </html>';
    }

    private function getFallbackHeaderHtml(array $data)
    {
        return '<header class="bg-white shadow-sm border-b">
            <div class="container mx-auto px-4 py-4">
                <h1 class="text-xl font-semibold tracking-tight">' . $data['site_name'] . '</h1>
            </div>
        </header>';
    }

    private function getFallbackFooterHtml(array $data)
    {
        return '<footer class="bg-gray-800 text-white py-8 mt-12">
            <div class="container mx-auto px-4 text-center">
                <p>&copy; ' . $data['current_year'] . ' ' . $data['site_name'] . '. All rights reserved.</p>
            </div>
        </footer>';
    }
}
