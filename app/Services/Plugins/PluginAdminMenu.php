<?php

namespace App\Services\Plugins;

use App\Models\Plugin;
use App\Models\User;
use App\Services\PluginManager;
use Illuminate\Support\Facades\Route;

/**
 * The admin sidebar entries active plugins declare in plugin.json:
 *
 *   "admin": {
 *     "menu": [{
 *       "label": "Shop", "label_key": "modulo-shop::admin.menu.shop",
 *       "icon": "ShoppingBag", "route": "dashboard.admin.shop.products.index",
 *       "permissions": ["view shop products"],
 *       "children": [{ "label": "Orders", "route": "...", "permissions": [...] }]
 *     }]
 *   }
 *
 * An entry shows when the user has any of its permissions (administrators
 * see everything). Links are a route name or a path inside /dashboard.
 */
class PluginAdminMenu
{
    public function __construct(protected PluginManager $plugins) {}

    /**
     * @return list<array{plugin: string, label: string, icon: string|null, href: string, children: list<array{label: string, href: string}>}>
     */
    public function for(?User $user): array
    {
        if ($user === null || ! schema_has_table('plugins')) {
            return [];
        }

        $menu = [];
        foreach (Plugin::query()->active()->orderBy('name')->pluck('slug') as $slug) {
            $entries = (array) data_get($this->plugins->manifest((string) $slug), 'admin.menu', []);

            foreach ($entries as $entry) {
                if (! is_array($entry) || ! $this->allowed($user, $entry)) {
                    continue;
                }

                $children = [];
                foreach ((array) ($entry['children'] ?? []) as $child) {
                    if (is_array($child) && $this->allowed($user, $child) && ($href = $this->href($child)) !== null) {
                        $children[] = ['label' => $this->label($child), 'href' => $href];
                    }
                }

                $href = $this->href($entry) ?? ($children[0]['href'] ?? null);
                if ($href === null) {
                    continue;
                }

                $menu[] = [
                    'plugin' => (string) $slug,
                    'label' => $this->label($entry),
                    'icon' => isset($entry['icon']) && is_string($entry['icon']) ? $entry['icon'] : null,
                    'href' => $href,
                    'children' => $children,
                ];
            }
        }

        /** @var list<array{plugin: string, label: string, icon: string|null, href: string, children: list<array{label: string, href: string}>}> */
        return apply_filters('admin_menu', $menu, $user);
    }

    /**
     * @param  array<string, mixed>  $entry
     */
    protected function allowed(User $user, array $entry): bool
    {
        $permissions = array_filter((array) ($entry['permissions'] ?? []), 'is_string');
        if ($permissions === [] || $user->hasRole(['admin', 'super-admin'])) {
            return true;
        }

        foreach ($permissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<string, mixed>  $entry
     */
    protected function label(array $entry): string
    {
        $key = $entry['label_key'] ?? null;
        if (is_string($key) && $key !== '' && __($key) !== $key) {
            return (string) __($key);
        }

        return (string) ($entry['label'] ?? '');
    }

    /**
     * Only admin links: a route that exists, or a path under /dashboard.
     *
     * @param  array<string, mixed>  $entry
     */
    protected function href(array $entry): ?string
    {
        if (isset($entry['route']) && is_string($entry['route']) && Route::has($entry['route'])) {
            return route($entry['route'], [], false);
        }

        $path = $entry['href'] ?? null;

        return is_string($path) && preg_match('#^/dashboard(/[A-Za-z0-9._~/-]*)?$#', $path) === 1 ? $path : null;
    }
}
