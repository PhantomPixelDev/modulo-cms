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
use App\Models\User;
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
            $data['adminStats'] = [
                'users' => User::count(),
                'roles' => Role::count(),
                'posts' => Post::count(),
                'postTypes' => PostType::count(),
                'taxonomies' => Taxonomy::count(),
                'taxonomyTerms' => TaxonomyTerm::count(),
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
        return [
            'server' => [
                'status' => 'online',
                'label' => 'Server Status',
                'value' => 'Online',
                'color' => 'green',
                'indicator' => 'pulse'
            ],
            'database' => [
                'status' => $this->checkDatabaseConnection() ? 'connected' : 'disconnected',
                'label' => 'Database',
                'value' => $this->checkDatabaseConnection() ? 'Connected' : 'Disconnected',
                'color' => $this->checkDatabaseConnection() ? 'green' : 'red',
                'indicator' => 'solid'
            ],
            'cache' => [
                'status' => 'active',
                'label' => 'Cache',
                'value' => 'Active',
                'color' => 'blue',
                'indicator' => 'solid'
            ],
            'storage' => [
                'status' => 'warning',
                'label' => 'Storage',
                'value' => $this->getStorageUsage() . '% Used',
                'color' => $this->getStorageUsage() > 80 ? 'yellow' : 'green',
                'indicator' => 'solid'
            ]
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

    private function getStorageUsage(): int
    {
        $storagePath = storage_path();
        if (!is_dir($storagePath)) {
            return 0;
        }

        $totalSpace = disk_total_space($storagePath);
        $freeSpace = disk_free_space($storagePath);
        
        if ($totalSpace === false || $freeSpace === false) {
            return 85; // Default fallback
        }

        $usedSpace = $totalSpace - $freeSpace;
        return (int) round(($usedSpace / $totalSpace) * 100);
    }
}
