<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Http\Requests\MenuItemRequest;
use App\Models\Locale;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Services\MenuService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class MenuItemController extends Controller
{
    // Policies govern all actions for menu items

    /**
     * Recursively delete a menu item's subtree (children, grandchildren, etc.).
     */
    private function deleteSubtree(MenuItem $item): void
    {
        $item->load('children');
        foreach ($item->children as $child) {
            $this->deleteSubtree($child);
        }
        $item->delete();
    }
    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\MenuItem::class);
        $menuId = $request->query('menu_id');
        $query = MenuItem::query()->with(['translations', 'children']);
        if ($menuId) {
            $query->where('menu_id', $menuId)->whereNull('parent_id');
        }
        $items = $query->with('children')->orderBy('order')->get();
        if ($request->wantsJson()) {
            return response()->json($items);
        }
        // HTML requests should use the unified Menus builder
        if ($menuId) {
            return redirect()->route('dashboard.admin.menus.show', ['menu' => $menuId]);
        }
        return redirect()->route('dashboard.admin.menus.index');
    }

    public function store(MenuItemRequest $request)
    {
        $this->authorize('create', \App\Models\MenuItem::class);
        $data = $request->validated();
        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        $item = MenuItem::create($data);
        $this->syncTranslations($item, $translations);
        $this->forgetMenuCacheFromMenu($item->menu);

        if ($request->wantsJson()) {
            return response()->json($item, Response::HTTP_CREATED);
        }
        return redirect()->route('dashboard.admin.menus.show', ['menu' => $item->menu_id]);
    }

    public function update(MenuItemRequest $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);
        $data = $request->validated();
        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        $menuItem->update($data);
        $this->syncTranslations($menuItem, $translations);
        $this->forgetMenuCacheFromMenu($menuItem->menu);

        if ($request->wantsJson()) {
            return response()->json($menuItem);
        }
        return redirect()->route('dashboard.admin.menus.show', ['menu' => $menuItem->menu_id]);
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        $this->authorize('delete', $menuItem);
        $menu = $menuItem->menu()->first();
        // Recursively delete full subtree
        $this->deleteSubtree($menuItem);
        $this->forgetMenuCacheFromMenu($menu);
        if ($request->wantsJson()) {
            return response()->noContent();
        }
        return redirect()->route('dashboard.admin.menus.show', ['menu' => $menuItem->menu_id]);
    }

    protected function syncTranslations(MenuItem $menuItem, array $translations = []): void
    {
        $menuItem->loadMissing('translations');
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', 'en');
        $handled = [];

        foreach ($translations as $translation) {
            $locale = $translation['locale'] ?? null;
            if (!$locale) {
                continue;
            }

            $payload = [
                'label' => $translation['label'] ?? $menuItem->label,
                'url' => $translation['url'] ?? $menuItem->url,
            ];

            $menuItem->setTranslation($locale, $payload);
            $handled[] = $locale;
        }

        if (!in_array($defaultLocale, $handled, true)) {
            $menuItem->setTranslation($defaultLocale, [
                'label' => $menuItem->label,
                'url' => $menuItem->url,
            ]);
        }
    }

    protected function forgetMenuCacheFromMenu(?Menu $menu): void
    {
        if (!$menu) {
            return;
        }

        app(MenuService::class)->forgetMenu($menu);
    }
}
