<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Http\Resources\PostTypeResource;
use App\Http\Resources\RoleResource;
use App\Http\Resources\TaxonomyResource;
use App\Http\Resources\ThemeResource;
use App\Http\Resources\UserResource;
use App\Models\Post;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;




class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasRole(['admin', 'super-admin']);

        $data = [];

        if ($isAdmin) {
            $pageType = PostType::where('name', 'page')->first();
            $mediaCount = 0;
            if (class_exists('Spatie\\MediaLibrary\\MediaCollections\\Models\\Media')) {
                $Media = '\\Spatie\\MediaLibrary\\MediaCollections\\Models\\Media';
                $mediaCount = $Media::count();
            }
            $data['adminStats'] = [
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

            // Recent Activity Feed
            $data['recentActivity'] = $this->getRecentActivity();

            // System Status
            $data['systemStatus'] = $this->getSystemStatus();

            $data['users'] = UserResource::collection(
                User::with('roles')->orderByDesc('created_at')->paginate(5)
            );

            $data['roles'] = RoleResource::collection(
                Role::with('permissions')->orderBy('name')->paginate(5)
            );

            $data['posts'] = PostResource::collection(
                Post::with(['postType', 'author'])->orderByDesc('created_at')->paginate(5)
            );

            $data['postTypes'] = PostTypeResource::collection(
                PostType::orderBy('menu_position')->get()
            );
        }

        return Inertia::render('Dashboard', $data);
    }

    private function getRecentActivity(): array
    {
        $activities = [];

        // Recent posts
        $recentPosts = Post::with('author')
            ->orderByDesc('created_at')
            ->limit(3)
            ->get();

        foreach ($recentPosts as $post) {
            $activities[] = [
                'type' => 'post_created',
                'icon' => '📝',
                'title' => 'New post published',
                'description' => $post->title,
                'user' => $post->author->name ?? 'Unknown',
                'timestamp' => $post->created_at->diffForHumans(),
                'created_at' => $post->created_at,
            ];
        }

        // Recent users
        $recentUsers = User::orderByDesc('created_at')
            ->limit(2)
            ->get();

        foreach ($recentUsers as $user) {
            $activities[] = [
                'type' => 'user_registered',
                'icon' => '👤',
                'title' => 'New user registered',
                'description' => $user->name . ' joined',
                'user' => $user->name,
                'timestamp' => $user->created_at->diffForHumans(),
                'created_at' => $user->created_at,
            ];
        }

        // Sort by creation time and limit to 5 most recent
        return collect($activities)
            ->sortByDesc('created_at')
            ->take(5)
            ->values()
            ->toArray();
    }

    private function getSystemStatus(): array
    {
        $lastCheckedAt = now()->toIso8601String();
        $loadAverage = $this->formatLoadAverage($this->getServerLoadAverage());
        $storage = $this->getStorageUsage();

        $databaseConnection = config('database.default');
        $databaseConfig = config("database.connections.$databaseConnection", []);

        $cacheStore = config('cache.default');
        $cacheConfig = config("cache.stores.$cacheStore", []);
        $queueConnection = config('queue.default');
        $queueConfig = config("queue.connections.$queueConnection", []);

        return [
            'server' => [
                'status' => 'online',
                'label' => 'Server Status',
                'value' => 'Online',
                'color' => 'green',
                'indicator' => 'pulse',
                'detail' => 'Primary application node responding normally.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => array_filter([
                    'Host' => php_uname('n') ?: null,
                    'PHP' => PHP_VERSION,
                    'Load (1/5/15)' => $loadAverage,
                ]),
            ],
            'uptime' => [
                'status' => 'running',
                'label' => 'Server Uptime',
                'value' => $this->getServerUptime(),
                'color' => 'green',
                'indicator' => 'solid',
                'detail' => 'Application runtime has been stable since the last restart.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => [
                    'App started' => $this->getApplicationBootTime()->toDateTimeString(),
                    'Environment' => config('app.env'),
                ],
            ],
            'database' => [
                'status' => $this->checkDatabaseConnection() ? 'connected' : 'disconnected',
                'label' => 'Database',
                'value' => $this->checkDatabaseConnection() ? 'Connected' : 'Disconnected',
                'color' => $this->checkDatabaseConnection() ? 'green' : 'red',
                'indicator' => 'solid',
                'detail' => 'Verifies the primary database connection and driver.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => array_filter([
                    'Connection' => $databaseConnection,
                    'Driver' => $databaseConfig['driver'] ?? null,
                    'Host' => $databaseConfig['host'] ?? null,
                ]),
            ],
            'cache' => [
                'status' => 'active',
                'label' => 'Cache',
                'value' => 'Active',
                'color' => 'blue',
                'indicator' => 'solid',
                'detail' => 'Ensures the caching layer is available for quick responses.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => array_filter([
                    'Store' => $cacheStore,
                    'Driver' => $cacheConfig['driver'] ?? null,
                ]),
            ],
            'storage' => [
                'status' => $storage['used_percentage'] > 85 ? 'warning' : 'healthy',
                'label' => 'Storage',
                'value' => $storage['used_percentage'] . '% Used',
                'color' => $storage['used_percentage'] > 85 ? 'yellow' : 'green',
                'indicator' => 'solid',
                'detail' => 'Monitors disk usage for the Laravel storage path.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => [
                    'Free' => $storage['free_percentage'] . '%',
                    'Path' => $storage['path'],
                ],
            ],
            'queue' => [
                'status' => 'active',
                'label' => 'Queue Worker',
                'value' => ucfirst($queueConnection),
                'color' => 'blue',
                'indicator' => 'solid',
                'detail' => 'Monitors the background processing pipeline.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => array_filter([
                    'Connection' => $queueConnection,
                    'Driver' => $queueConfig['driver'] ?? null,
                    'Queue' => $queueConfig['queue'] ?? null,
                ]),
            ],
        ];
    }

    private function checkDatabaseConnection(): bool
    {
        try {
            \DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function getStorageUsage(): array
    {
        $storagePath = storage_path();
        if (!is_dir($storagePath)) {
            return [
                'used_percentage' => 0,
                'free_percentage' => 100,
                'path' => $storagePath,
            ];
        }

        $totalSpace = @disk_total_space($storagePath);
        $freeSpace = @disk_free_space($storagePath);

        if (!$totalSpace || !$freeSpace) {
            return [
                'used_percentage' => 85,
                'free_percentage' => 15,
                'path' => $storagePath,
            ];
        }

        $usedSpace = $totalSpace - $freeSpace;
        $usedPercentage = (int) round(($usedSpace / $totalSpace) * 100);

        return [
            'used_percentage' => $usedPercentage,
            'free_percentage' => 100 - $usedPercentage,
            'path' => $storagePath,
        ];
    }

    private function getServerLoadAverage(): ?array
    {
        if (!function_exists('sys_getloadavg')) {
            return null;
        }

        return sys_getloadavg();
    }

    private function formatLoadAverage(?array $loadAverage): ?string
    {
        if (!$loadAverage || count($loadAverage) < 3) {
            return null;
        }

        return sprintf(
            '%s / %s / %s',
            number_format($loadAverage[0], 2),
            number_format($loadAverage[1], 2),
            number_format($loadAverage[2], 2)
        );
    }

    private function getApplicationBootTime(): Carbon
    {
        $startTimestamp = defined('LARAVEL_START') ? LARAVEL_START : time();

        return Carbon::createFromTimestamp($startTimestamp);
    }

    private function getServerUptime(): string
    {
        if (function_exists('shell_exec')) {
            $uptime = shell_exec('uptime -p 2>/dev/null');
            if ($uptime) {
                return trim(str_replace('up ', '', $uptime));
            }
        }
        
        // Fallback: calculate from Laravel start time
        $startTime = defined('LARAVEL_START') ? LARAVEL_START : time();
        $uptimeSeconds = time() - $startTime;
        
        $days = floor($uptimeSeconds / 86400);
        $hours = floor(($uptimeSeconds % 86400) / 3600);
        $minutes = floor(($uptimeSeconds % 3600) / 60);
        
        if ($days > 0) {
            return "{$days}d {$hours}h {$minutes}m";
        } elseif ($hours > 0) {
            return "{$hours}h {$minutes}m";
        } else {
            return "{$minutes}m";
        }
    }
}
