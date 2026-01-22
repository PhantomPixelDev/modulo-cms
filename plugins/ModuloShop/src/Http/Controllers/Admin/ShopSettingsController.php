<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use App\Models\Plugin;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ShopSettingsController
{
    public function index(Request $request): JsonResponse|Response
    {
        $this->authorize();

        $plugin = Plugin::where('slug', 'modulo-shop')->first();
        $settings = $plugin?->settings ?? [];

        $defaults = [
            'store_name' => 'My Shop',
            'currency' => 'USD',
            'currency_position' => 'before', // before or after
            'thousand_separator' => ',',
            'decimal_separator' => '.',
            'decimals' => 2,
            'products_per_page' => 12,
            'enable_reviews' => false,
            'enable_stock_management' => true,
            'low_stock_threshold' => 5,
            'out_of_stock_visibility' => true,
            'cart_page_id' => null,
            'checkout_page_id' => null,
            'terms_page_id' => null,
        ];

        $settings = array_merge($defaults, $settings);

        if ($request->wantsJson()) {
            return response()->json($settings);
        }

        return Inertia::render('Dashboard', [
            'adminSection' => 'shop-settings',
            'shopSettings' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse|RedirectResponse
    {
        $this->authorize();

        $data = $request->validate([
            'store_name' => 'required|string|max:255',
            'currency' => 'required|string|max:10',
            'currency_position' => 'required|in:before,after',
            'thousand_separator' => 'required|string|max:1',
            'decimal_separator' => 'required|string|max:1',
            'decimals' => 'required|integer|min:0|max:4',
            'products_per_page' => 'required|integer|min:1|max:100',
            'enable_reviews' => 'boolean',
            'enable_stock_management' => 'boolean',
            'low_stock_threshold' => 'required|integer|min:0',
            'out_of_stock_visibility' => 'boolean',
            'cart_page_id' => 'nullable|integer',
            'checkout_page_id' => 'nullable|integer',
            'terms_page_id' => 'nullable|integer',
        ]);

        $plugin = Plugin::where('slug', 'modulo-shop')->first();
        
        if ($plugin) {
            $plugin->settings = $data;
            $plugin->save();
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'settings' => $data]);
        }

        return back()->with('success', 'Shop settings updated successfully');
    }

    protected function authorize(): void
    {
        $user = auth()->user();
        if (!$user) abort(403);
        if ($user->can('manage shop settings') || $user->hasRole(['admin', 'super-admin'])) return;
        abort(403);
    }
}
