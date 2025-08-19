<?php

namespace App\Services;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Support\Facades\Auth;

class MenuService
{
    public function getMenuByLocation(string $location): ?Menu
    {
        return Menu::with(['items.children'])
            ->where('location', $location)
            ->first();
    }

    public function getMenuBySlug(string $slug): ?Menu
    {
        return Menu::with(['items.children'])
            ->where('slug', $slug)
            ->first();
    }

    public function renderMenuHtml(?Menu $menu, array $options = []): string
    {
        if (!$menu) return '';
        $class = $options['class'] ?? 'flex items-center gap-4';
        return '<nav footer-menu><ul class="' . e($class) . '">' . $this->renderItems($menu->items) . '</ul></nav>';
    }

    private function renderItems($items): string
    {
        $html = '';
        foreach ($items as $item) {
            if (!$this->isVisible($item)) continue;
            $url = $this->resolveUrl($item);
            $label = e($item->label);
            $target = $item->target ? ' target="' . e($item->target) . '"' : '';
            $html .= '<li><a href="' . e($url) . '"' . $target . ' class="hover:underline">' . $label . '</a>';
            if ($item->children && $item->children->count() > 0) {
                $html .= '<ul class="ml-4">' . $this->renderItems($item->children) . '</ul>';
            }
            $html .= '</li>';
        }
        return $html;
    }

    private function isVisible(MenuItem $item): bool
    {
        $v = $item->visible_to ?: 'all';
        if ($v === 'all') return true;
        if ($v === 'auth') return Auth::check();
        if ($v === 'guest') return !Auth::check();
        return true;
    }

    private function resolveUrl(MenuItem $item): string
    {
        if (!empty($item->url)) return $item->url;
        if (!empty($item->page_slug)) return url('/' . ltrim($item->page_slug, '/'));
        if (!empty($item->route_name)) {
            try { return route($item->route_name); } catch (\Throwable $e) { return '#'; }
        }
        return '#';
    }

    /**
     * Build a filtered nested array for a menu suitable for JSON / Inertia.
     */
    public function buildMenuTree(?Menu $menu): array
    {
        if (!$menu) return [];
        return [
            'id' => $menu->id,
            'name' => $menu->name,
            'slug' => $menu->slug,
            'location' => $menu->location,
            'items' => $this->itemsToArray($menu->items),
        ];
    }

    private function itemsToArray($items): array
    {
        $out = [];
        foreach ($items as $item) {
            if (!$this->isVisible($item)) continue;
            $out[] = [
                'id' => $item->id,
                'label' => $item->label,
                'url' => $this->resolveUrl($item),
                'target' => $item->target,
                'children' => $this->itemsToArray($item->children ?? collect()),
            ];
        }
        return $out;
    }

    public function menuArrayBySlug(string $slug): array
    {
        return $this->buildMenuTree($this->getMenuBySlug($slug));
    }

    public function menuArrayByLocation(string $location): array
    {
        return $this->buildMenuTree($this->getMenuByLocation($location));
    }
}
