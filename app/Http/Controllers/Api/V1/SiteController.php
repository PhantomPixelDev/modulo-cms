<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Services\MenuService;
use App\Services\SiteSettingsService;
use Illuminate\Http\JsonResponse;

/**
 * Site-wide data a headless front end needs: settings, content types,
 * taxonomies and menus. All public.
 */
class SiteController extends Controller
{
    public function site(SiteSettingsService $settings): JsonResponse
    {
        $public = $settings->getPublicSettings();

        return response()->json(['data' => [
            'name' => $public['site_name'],
            'tagline' => $public['site_tagline'],
            'url' => $public['site_url'],
            'logo' => $public['site_logo'],
            'favicon' => $public['site_favicon'],
            'description' => $public['seo']['meta_description'] ?? null,
            'locale' => app()->getLocale(),
            'timezone' => $public['timezone'],
            'social' => $public['social'],
        ]]);
    }

    public function postTypes(): JsonResponse
    {
        return response()->json(['data' => PostType::query()->where('is_public', true)->orderBy('name')->get()
            ->map(fn (PostType $type) => [
                'name' => $type->name,
                'label' => $type->label,
                'plural_label' => $type->plural_label,
                'slug' => $type->slug,
                'route_prefix' => $type->route_prefix,
            ])]);
    }

    public function taxonomies(): JsonResponse
    {
        return response()->json(['data' => Taxonomy::query()->where('is_public', true)->orderBy('name')->get()
            ->map(fn (Taxonomy $taxonomy) => [
                'name' => $taxonomy->name,
                'label' => $taxonomy->label,
                'slug' => $taxonomy->slug,
                'hierarchical' => (bool) $taxonomy->is_hierarchical,
            ])]);
    }

    public function terms(string $slug): JsonResponse
    {
        $taxonomy = Taxonomy::query()->where('is_public', true)->where(fn ($q) => $q->where('slug', $slug)->orWhere('name', $slug))->firstOrFail();

        return response()->json(['data' => TaxonomyTerm::query()->where('taxonomy_id', $taxonomy->id)->orderBy('term_order')->orderBy('name')->get()
            ->map(fn (TaxonomyTerm $term) => [
                'id' => $term->id,
                'name' => $term->name,
                'slug' => $term->slug,
                'description' => $term->description,
                'parent_id' => $term->parent_id,
            ])]);
    }

    public function menu(MenuService $menus, string $location): JsonResponse
    {
        $items = $menus->menuArrayByLocation($location) ?: $menus->menuArrayBySlug($location);

        abort_if($items === [], 404, 'No menu at that location.');

        return response()->json(['data' => $items]);
    }
}
