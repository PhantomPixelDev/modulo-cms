<?php

namespace App\Services;

use App\Models\PostType;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class PostTypeService
{
    protected int $ttl;

    public function __construct(int $ttl = 300)
    {
        $this->ttl = $ttl;
    }

    public function allPublic()
    {
        if (!Schema::hasTable('post_types')) {
            return collect();
        }
        return Cache::remember('post_types:public', $this->ttl, function () {
            return PostType::where('is_public', true)->orderBy('label')->get();
        });
    }

    public function byId(int $id): ?PostType
    {
        if (!Schema::hasTable('post_types')) {
            return null;
        }
        return Cache::remember('post_types:id:' . $id, $this->ttl, function () use ($id) {
            return PostType::find($id);
        });
    }

    public function byRoutePrefix(?string $prefix): ?PostType
    {
        if (!Schema::hasTable('post_types')) {
            return null;
        }
        $key = 'post_types:route_prefix:' . ($prefix ?: 'root');
        return Cache::remember($key, $this->ttl, function () use ($prefix) {
            return PostType::where(function($q) use ($prefix) {
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
        Cache::forget('post_types:public');
        // Note: specific id/route_prefix entries can't be enumerated; rely on TTL or call site to forget keys when known
    }
}
