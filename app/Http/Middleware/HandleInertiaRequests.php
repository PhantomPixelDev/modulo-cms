<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;
use App\Models\TaxonomyTerm;
use Illuminate\Support\Facades\Schema;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }


    /**
     * Get sidebar data for all pages
     */
    protected function getSidebarData(): array
    {
        // Check if tables exist (for fresh installs)
        if (!Schema::hasTable('taxonomy_terms')) {
            return ['categories' => [], 'tags' => []];
        }

        try {
            // Get categories with post counts
            $categories = TaxonomyTerm::whereHas('taxonomy', function($q) {
                $q->where('slug', 'categories');
            })
            ->withCount(['posts' => function($q) {
                $q->where('status', 'published');
            }])
            ->get()
            ->map(function($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                    'posts_count' => $term->posts_count,
                ];
            });

            // Get tags
            $tags = TaxonomyTerm::whereHas('taxonomy', function($q) {
                $q->where('slug', 'tags');
            })
            ->get()
            ->map(function($term) {
                return [
                    'id' => $term->id,
                    'name' => $term->name,
                    'slug' => $term->slug,
                ];
            });

            return [
                'categories' => $categories->toArray(),
                'tags' => $tags->toArray(),
            ];
        } catch (\Exception $e) {
            // Fallback in case of any errors
            return ['categories' => [], 'tags' => []];
        }
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $sidebarData = $this->getSidebarData();
        
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'categories' => $sidebarData['categories'],
            'tags' => $sidebarData['tags'],
            // Expose session flash messages for toasts
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'roles' => $request->user()->roles->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                        ];
                    }),
                    'permissions' => $request->user()->getAllPermissions()->map(function ($permission) {
                        return [
                            'id' => $permission->id,
                            'name' => $permission->name,
                        ];
                    }),
                ] : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
