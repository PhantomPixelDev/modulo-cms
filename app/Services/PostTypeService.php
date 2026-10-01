<?php

namespace App\Services;

use App\Models\PostType;
use Illuminate\Support\Facades\Cache;

class PostTypeService
{
    /**
     * Bumping this version invalidates every cached post type lookup at
     * once, so renamed slugs and prefixes can never go stale.
     */
    protected const VERSION_KEY = 'post_types:cache_version';

    protected int $ttl;

    public function __construct(int $ttl = 300)
    {
        $this->ttl = $ttl;
    }

    public function allPublic()
    {
        if (! schema_has_table('post_types')) {
            return collect();
        }

        return Cache::remember('post_types:v'.$this->cacheVersion().':public', $this->ttl, function () {
            return PostType::where('is_public', true)->orderBy('label')->get();
        });
    }

    public function byId(int $id): ?PostType
    {
        if (! schema_has_table('post_types')) {
            return null;
        }

        return Cache::remember('post_types:v'.$this->cacheVersion().':id:'.$id, $this->ttl, function () use ($id) {
            return PostType::find($id);
        });
    }

    public function byRoutePrefix(?string $prefix): ?PostType
    {
        if (! schema_has_table('post_types')) {
            return null;
        }
        $key = 'post_types:v'.$this->cacheVersion().':route_prefix:'.($prefix ?: 'root');

        return Cache::remember($key, $this->ttl, function () use ($prefix) {
            return PostType::where(function ($q) use ($prefix) {
                if ($prefix === null || $prefix === '' || $prefix === '/') {
                    $q->whereNull('route_prefix')->orWhere('route_prefix', '')->orWhere('route_prefix', '/');
                } else {
                    $q->where('route_prefix', $prefix);
                }
            })->first();
        });
    }

    public function clearCaches(): void
    {
        Cache::forever(self::VERSION_KEY, $this->cacheVersion() + 1);
    }

    protected function cacheVersion(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }
}
