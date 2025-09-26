<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
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
        $query = MenuItem::query();
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

    public function store(Request $request)
    {
        $this->authorize('create', \App\Models\MenuItem::class);
        $data = $request->validate([
            'menu_id' => 'required|exists:menus,id',
            'parent_id' => 'nullable|exists:menu_items,id',
            'label' => 'required|string|max:255',
            'url' => 'nullable|string|max:2048',
            'page_slug' => 'nullable|string|max:255',
            'route_name' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
            'visible_to' => 'nullable|in:all,guest,auth',
            'target' => 'nullable|in:_self,_blank',
        ]);
        $item = MenuItem::create($data);
        if ($request->wantsJson()) {
            return response()->json($item, Response::HTTP_CREATED);
        }
        return redirect()->route('dashboard.admin.menus.show', ['menu' => $item->menu_id]);
    }

    public function update(Request $request, MenuItem $menuItem)
    {
        $this->authorize('update', $menuItem);
        $data = $request->validate([
            'parent_id' => 'nullable|exists:menu_items,id',
            'label' => 'required|string|max:255',
            'url' => 'nullable|string|max:2048',
            'page_slug' => 'nullable|string|max:255',
            'route_name' => 'nullable|string|max:255',
            'order' => 'nullable|integer',
            'visible_to' => 'nullable|in:all,guest,auth',
            'target' => 'nullable|in:_self,_blank',
        ]);
        $menuItem->update($data);
        if ($request->wantsJson()) {
            return response()->json($menuItem);
        }
        return redirect()->route('dashboard.admin.menus.show', ['menu' => $menuItem->menu_id]);
    }

    public function destroy(Request $request, MenuItem $menuItem)
    {
        $this->authorize('delete', $menuItem);
        // Recursively delete full subtree
        $this->deleteSubtree($menuItem);
        if ($request->wantsJson()) {
            return response()->noContent();
        }
        return redirect()->route('dashboard.admin.menus.show', ['menu' => $menuItem->menu_id]);
    }
}
