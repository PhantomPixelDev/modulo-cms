<?php

namespace App\Http\Controllers\Content;

use App\Http\Controllers\Controller;
use App\Models\Locale;
use App\Models\Menu;
use App\Models\MenuItem;
use App\Models\Post;
use App\Services\MenuService;
use App\Services\ThemeManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class MenuController extends Controller
{
    /** Levels of nesting the builder allows; themes rarely show more. */
    public const MAX_DEPTH = 3;

    public function __construct()
    {
        // Policies handle authorization for menu actions
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Menu::class);
        $menus = Menu::with('items')->orderBy('name')->get();
        if ($request->wantsJson()) {
            return response()->json($menus);
        }

        return Inertia::render('admin/menus/index', [
            'menus' => $menus,
            'locations' => $this->locations(),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Menu::class);
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

        // Straight into the builder: a new menu is empty
        return redirect()->route('dashboard.admin.menus.show', $menu)->with('success', __('dashboard.menus.messages.saved'));
    }

    public function show(Request $request, Menu $menu)
    {
        $this->authorize('view', $menu);
        $menu->load(['items' => function ($query) {
            $query->with(['translations', 'children']);
        }]);
        if ($request->wantsJson()) {
            return response()->json($menu);
        }

        return Inertia::render('admin/menus/show', [
            'menu' => $menu->only(['id', 'name', 'slug', 'location', 'description']),
            // Flat, in order; the builder turns it into a tree
            'items' => $menu->allItems()->with('translations:id,menu_item_id,locale,label,url')
                ->orderBy('parent_id')->orderBy('order')->orderBy('id')->get(),
            // What can be added with a click
            'pages' => Post::whereHas('postType', fn ($q) => $q->where('name', 'page'))
                ->orderBy('title')->get(['id', 'title', 'slug', 'status']),
            'locales' => Locale::getActive(),
            'locations' => $this->locations(),
        ]);
    }

    public function update(Request $request, Menu $menu)
    {
        $this->authorize('update', $menu);
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:menus,slug,'.$menu->id,
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

        return back()->with('success', __('dashboard.menus.messages.saved'));
    }

    /**
     * Save the whole tree at once, as the builder shows it: every item with
     * its parent, in display order. Order is the position among siblings.
     */
    public function reorder(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('update', $menu);
        $data = $request->validate([
            'items' => ['present', 'array', 'max:500'],
            'items.*.id' => ['required', 'integer'],
            'items.*.parent_id' => ['nullable', 'integer'],
        ]);

        $ids = MenuItem::where('menu_id', $menu->id)->pluck('id')->all();
        $parents = [];
        foreach ($data['items'] as $row) {
            $parents[(int) $row['id']] = isset($row['parent_id']) ? (int) $row['parent_id'] : null;
        }

        // Only this menu's items, each one once, no loops, not too deep
        $invalid = fn (string $message) => ValidationException::withMessages(['items' => $message]);
        if (array_diff(array_keys($parents), $ids) !== [] || count($parents) !== count($data['items'])) {
            throw $invalid('Unknown menu item.');
        }
        foreach ($parents as $id => $parent) {
            if ($parent !== null && ! array_key_exists($parent, $parents)) {
                throw $invalid('Unknown parent.');
            }
            $ancestors = 0;
            for ($at = $parent; $at !== null; $at = $parents[$at]) {
                // An item on the deepest allowed level has MAX_DEPTH - 1 ancestors
                if (++$ancestors >= self::MAX_DEPTH || $at === $id) {
                    throw $invalid('Menus can be nested '.self::MAX_DEPTH.' levels deep.');
                }
            }
        }

        DB::transaction(function () use ($parents) {
            $position = [];
            foreach ($parents as $id => $parent) {
                $key = $parent ?? 0;
                $position[$key] = ($position[$key] ?? -1) + 1;
                MenuItem::whereKey($id)->update(['parent_id' => $parent, 'order' => $position[$key]]);
            }
        });
        app(MenuService::class)->forgetMenu($menu);

        return back();
    }

    /**
     * Add pages to the end of the menu in one go.
     */
    public function addPages(Request $request, Menu $menu): RedirectResponse
    {
        $this->authorize('create', MenuItem::class);
        $data = $request->validate([
            'page_ids' => ['required', 'array', 'max:100'],
            'page_ids.*' => ['integer'],
        ]);

        $pages = Post::whereIn('id', $data['page_ids'])
            ->whereHas('postType', fn ($q) => $q->where('name', 'page'))
            ->orderBy('title')->get(['id', 'title', 'slug']);
        $order = (int) MenuItem::where('menu_id', $menu->id)->whereNull('parent_id')->max('order');

        foreach ($pages as $page) {
            MenuItem::create([
                'menu_id' => $menu->id,
                'label' => $page->title,
                'page_slug' => $page->slug,
                'order' => ++$order,
            ]);
        }
        app(MenuService::class)->forgetMenu($menu);

        return back()->with('success', trans_choice('dashboard.menus.messages.pages_added', $pages->count(), ['count' => $pages->count()]));
    }

    /**
     * The places the active theme can show a menu, e.g. header => "Header Navigation".
     *
     * @return array<string, string>
     */
    protected function locations(): array
    {
        $menus = app(ThemeManager::class)->getActiveTheme()?->menus;

        return is_array($menus) ? array_map('strval', $menus) : [];
    }

    public function destroy(Request $request, Menu $menu)
    {
        $this->authorize('delete', $menu);
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
