<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use App\Services\AdminStatsService;
use App\Services\DashboardOverview;
use App\Services\RuntimeHealth;
use App\Services\SiteSettingsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected SiteSettingsService $settings
    ) {}

    public function index(): Response
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasRole(['admin', 'super-admin']);

        $data = [];

        if ($user?->can('access admin') || $isAdmin) {
            $data['overview'] = app(DashboardOverview::class)->for($user);
        }

        if ($isAdmin) {
            $data['adminStats'] = app(AdminStatsService::class)->get();

            // System Status
            $data['systemStatus'] = $this->getSystemStatus();

        }

        return Inertia::render('Dashboard', $data);
    }

    /**
     * Hides the getting-started checklist for everyone, once the person
     * running the site no longer needs it.
     */
    public function dismissOnboarding(): RedirectResponse
    {
        $this->authorize('update', SiteSetting::class);
        SiteSetting::set('onboarding_dismissed', true, 'general', 'boolean');

        return back();
    }

    private function getSystemStatus(): array
    {
        $lastCheckedAt = now()->toIso8601String();
        $health = app(RuntimeHealth::class);
        $checks = $health->readiness();
        $queueStatus = $health->backgroundStatus('queue');
        $schedulerStatus = $health->backgroundStatus('scheduler');
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
                'status' => $health->startedAt() !== null ? 'running' : 'unavailable',
                'label' => 'Server Uptime',
                'value' => $this->getServerUptime(),
                'color' => $health->startedAt() !== null ? 'green' : 'gray',
                'indicator' => 'solid',
                'detail' => 'Time since this application container started. Unavailable without a reliable startup timestamp.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => [
                    'App started' => $health->startedAt() ? Carbon::createFromTimestamp($health->startedAt())->toDateTimeString() : 'Unavailable',
                    'Environment' => config('app.env'),
                ],
            ],
            'database' => [
                'status' => $checks['database'] ? 'connected' : 'disconnected',
                'label' => 'Database',
                'value' => $checks['database'] ? 'Connected' : 'Disconnected',
                'color' => $checks['database'] ? 'green' : 'red',
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
                'status' => $checks['cache'] ? 'active' : 'unavailable',
                'label' => 'Cache',
                'value' => $checks['cache'] ? 'Active' : 'Unavailable',
                'color' => $checks['cache'] ? 'green' : 'red',
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
                'value' => $storage['used_percentage'].'% Used',
                'color' => $storage['used_percentage'] > 85 ? 'yellow' : 'green',
                'indicator' => 'solid',
                'detail' => 'Monitors disk usage for the Laravel storage path.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => [
                    'Free' => $storage['free_percentage'].'%',
                    'Path' => $storage['path'],
                ],
            ],
            'scheduler' => [
                'status' => $schedulerStatus, 'label' => 'Scheduler', 'value' => ucfirst($schedulerStatus),
                'color' => $schedulerStatus === 'active' ? 'green' : 'yellow', 'indicator' => 'solid',
                'detail' => 'Scheduler heartbeat; stale after three minutes.', 'last_checked_at' => $lastCheckedAt,
            ],
            'queue' => [
                'status' => $queueStatus,
                'label' => 'Queue Worker',
                'value' => $queueStatus === 'inline' ? 'Inline processing' : ucfirst($queueStatus),
                'color' => in_array($queueStatus, ['active', 'inline'], true) ? 'green' : 'yellow',
                'indicator' => 'solid',
                'detail' => 'Queue loop heartbeat; stale after three minutes. Independent of web readiness.',
                'last_checked_at' => $lastCheckedAt,
                'meta' => array_filter([
                    'Connection' => $queueConnection,
                    'Driver' => $queueConfig['driver'] ?? null,
                    'Queue' => $queueConfig['queue'] ?? null,
                ]),
            ],
        ];
    }

    private function getStorageUsage(): array
    {
        $storagePath = storage_path();
        if (! is_dir($storagePath)) {
            return [
                'used_percentage' => 0,
                'free_percentage' => 100,
                'path' => $storagePath,
            ];
        }

        $totalSpace = @disk_total_space($storagePath);
        $freeSpace = @disk_free_space($storagePath);

        if (! $totalSpace || ! $freeSpace) {
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
        if (! function_exists('sys_getloadavg')) {
            return null;
        }

        return sys_getloadavg();
    }

    private function formatLoadAverage(?array $loadAverage): ?string
    {
        if (! $loadAverage || count($loadAverage) < 3) {
            return null;
        }

        return sprintf(
            '%s / %s / %s',
            number_format($loadAverage[0], 2),
            number_format($loadAverage[1], 2),
            number_format($loadAverage[2], 2)
        );
    }

    private function getServerUptime(): string
    {
        $startTime = app(RuntimeHealth::class)->startedAt();
        if ($startTime === null) {
            return 'Unavailable';
        }
        $uptimeSeconds = (int) (time() - $startTime);

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
