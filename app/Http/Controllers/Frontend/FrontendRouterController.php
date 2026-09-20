<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Locale;
use App\Models\PostType;
use App\Models\SiteSetting;
use App\Models\Taxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

/**
 * Single entry point for public "pretty" URLs.
 *
 * Post type archives and taxonomy bases used to be registered as routes from
 * the database on every boot, which made route:cache impossible and meant a
 * page slug of two letters (/us) was swallowed by the {locale} prefix.
 * Everything is resolved here instead, so the route table stays static.
 */
class FrontendRouterController extends Controller
{
    public function __construct(
        protected HomeController $home,
        protected PostController $posts,
        protected TaxonomyController $taxonomies,
    ) {}

    public function __invoke(Request $request, string $one, ?string $two = null, ?string $three = null)
    {
        $segments = array_values(array_filter([$one, $two, $three], fn ($segment) => $segment !== null && $segment !== ''));

        if ($this->applyLocale($segments[0])) {
            array_shift($segments);
        }

        return match (count($segments)) {
            0 => ($this->home)($request),
            1 => $this->resolveSingle($request, $segments[0]),
            2 => $this->resolvePair($request, $segments[0], $segments[1]),
            default => abort(404),
        };
    }

    /**
     * /{slug} - post type archive, the configured posts page, or a page.
     */
    protected function resolveSingle(Request $request, string $slug)
    {
        // /posts (and /{locale}/posts) is the classic post archive
        if ($slug === 'posts') {
            return $this->posts->archive($request, $this->classicPostType());
        }

        abort_if($this->isReserved($slug), 404);

        if ($postType = $this->publicPostTypeByPrefix($slug)) {
            return $this->posts->archive($request, $postType);
        }

        $postsPageId = SiteSetting::get('posts_page_id');
        if ($postsPageId && $this->posts->isPostsPage($slug, (int) $postsPageId)) {
            return $this->posts->archive($request, null);
        }

        return $this->posts->page($request, $slug);
    }

    /**
     * /{base}/{slug} - taxonomy term archive or a post of a custom type.
     */
    protected function resolvePair(Request $request, string $base, string $slug)
    {
        if ($base === 'posts') {
            return $this->posts->show($request, $slug);
        }

        abort_if($this->isReserved($base), 404);

        if ($taxonomy = $this->taxonomyByBase($base)) {
            return $this->taxonomies->archive($request, $taxonomy, $slug);
        }

        if ($postType = $this->publicPostTypeByPrefix($base)) {
            return $this->posts->typedPost($request, $postType, $slug);
        }

        abort(404);
    }

    protected function applyLocale(string $segment): bool
    {
        if (! preg_match('/^[a-z]{2}$/', $segment) || ! schema_has_table('locales')) {
            return false;
        }

        if (! Locale::isValidCode($segment)) {
            return false;
        }

        App::setLocale($segment);
        Session::put('locale', $segment);
        view()->share('currentLocale', $segment);

        return true;
    }

    protected function classicPostType(): ?PostType
    {
        return PostType::where('slug', 'post')->first();
    }

    protected function publicPostTypeByPrefix(string $prefix): ?PostType
    {
        if ($prefix === '') {
            return null;
        }

        return PostType::where('route_prefix', $prefix)->where('is_public', true)->first();
    }

    /**
     * Matches the configured category/tag bases, their plural aliases and any
     * public taxonomy slug (so /genres/rock works without extra config).
     */
    protected function taxonomyByBase(string $base): ?Taxonomy
    {
        $bases = [
            (string) SiteSetting::get('category_base', 'category') => 'categories',
            (string) SiteSetting::get('tag_base', 'tag') => 'tags',
            'categories' => 'categories',
            'tags' => 'tags',
        ];

        $slug = $bases[$base] ?? $base;

        return Taxonomy::where('slug', $slug)->where('is_public', true)->first();
    }

    protected function isReserved(string $slug): bool
    {
        return in_array($slug, config('routes.reserved_slugs', []), true);
    }
}
