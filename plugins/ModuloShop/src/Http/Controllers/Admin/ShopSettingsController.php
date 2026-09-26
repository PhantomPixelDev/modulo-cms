<?php

namespace Plugins\ModuloShop\src\Http\Controllers\Admin;

use App\Models\Plugin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;

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
            'enable_checkout' => true,
            'tax_rate' => 0,
            'prices_include_tax' => false,
            'shipping_methods' => [],
        ];

        $settings = array_merge($defaults, $settings);
        // Normalized rows (older installs stored a "Standard, Express" string)
        $settings['shipping_methods'] = array_map(
            fn (array $m) => ['name' => $m['name'], 'price' => $m['price'], 'free_over' => $m['free_over']],
            app(ModuloShopSettings::class)->shippingMethods(),
        );

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
            'enable_checkout' => 'sometimes|boolean',
            'invoice_details' => 'sometimes|nullable|string|max:1000',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'prices_include_tax' => 'sometimes|boolean',
            'shipping_methods' => 'sometimes|array|max:20',
            'shipping_methods.*.name' => 'required|string|max:100|distinct',
            'shipping_methods.*.price' => 'required|numeric|min:0',
            'shipping_methods.*.free_over' => 'nullable|numeric|min:0',
        ]);

        $plugin = Plugin::where('slug', 'modulo-shop')->first();

        // Merged: settings this form doesn't cover (tax rate, checkout switch,
        // gateways) must survive a save.
        $settings = array_merge($plugin->settings ?? [], $data);

        if ($plugin) {
            $plugin->settings = $settings;
            $plugin->save();
        }

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'settings' => $settings]);
        }

        return back()->with('success', 'Shop settings updated successfully');
    }

    protected function authorize(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403);
        }
        if ($user->can('manage shop settings') || $user->hasRole(['admin', 'super-admin'])) {
            return;
        }
        abort(403);
    }
}
