<?php

namespace App\Services;

use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

class AdminStatsService
{
    protected const CACHE_TTL = 60;
    protected const CACHE_KEY = 'admin_stats';

    public function get(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $pageType = PostType::where('name', 'page')->first();

            $mediaCount = 0;
            if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
                $mediaCount = \Spatie\MediaLibrary\MediaCollections\Models\Media::count();
            }

            return [
                'users' => User::count(),
                'roles' => Role::count(),
                'posts' => Post::count(),
                'pages' => $pageType ? Post::where('post_type_id', $pageType->id)->count() : 0,
                'postTypes' => PostType::count(),
                'taxonomies' => Taxonomy::count(),
                'taxonomyTerms' => TaxonomyTerm::count(),
                'themes' => Theme::count(),
                'media' => $mediaCount,
            ];
        });
    }

    public function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
