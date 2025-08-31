<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Services\MenuService;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $menus = Menu::with('items.children')->orderBy('name')->get();
        if ($request->wantsJson()) {
            return response()->json($menus);
        }
        return Inertia::render('admin/menus/index', [
            'menus' => $menus,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:menus,slug',
            'location' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);
        $menu = Menu::create($data);
        // Invalidate cache entries for this menu
        app(MenuService::class)->forgetMenu($menu);
        if ($request->wantsJson()) {
            return response()->json($menu, Response::HTTP_CREATED);
        }
        return redirect()->route('dashboard.admin.menus.index');
    }

    public function show(Request $request, Menu $menu)
    {
        $menu->load('items.children');
        if ($request->wantsJson()) {
            return response()->json($menu);
        }
        return Inertia::render('admin/menus/show', [
            'menu' => $menu,
        ]);
    }

    public function update(Request $request, Menu $menu)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:menus,slug,' . $menu->id,
            'location' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);
        $old = $menu->replicate();
        $menu->update($data);
        $svc = app(MenuService::class);
        // Forget by old identifiers and new ones
        $svc->forgetMenu($old);
        $svc->forgetMenu($menu);
        if ($request->wantsJson()) {
            return response()->json($menu);
        }
        return redirect()->route('dashboard.admin.menus.index');
    }

    public function destroy(Request $request, Menu $menu)
    {
        // Cascade delete items
        MenuItem::where('menu_id', $menu->id)->delete();
        // Invalidate cache entries for this menu before deletion
        app(MenuService::class)->forgetMenu($menu);
        $menu->delete();
        if ($request->wantsJson()) {
            return response()->noContent();
        }
        return redirect()->route('dashboard.admin.menus.index');
    }
}
