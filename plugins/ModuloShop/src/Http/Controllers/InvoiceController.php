<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;
use Plugins\ModuloShop\src\Services\PaymentService;

/**
 * A printable invoice (the browser's "Save as PDF" makes the PDF), reachable
 * with the same secret link as the order page, or by shop staff.
 */
class InvoiceController
{
    public function show(Request $request, string $orderNumber): View
    {
        $order = Order::where('order_number', $orderNumber)->with('items')->firstOrFail();
        $user = $request->user();
        $staff = $user !== null && ($user->can('view shop orders') || $user->hasRole(['admin', 'super-admin']));

        abort_unless($staff || $order->canBeViewedWith($user, $request->query('key')), 404);

        $settings = app(ModuloShopSettings::class);

        /** @var view-string $view Plugin views are registered at boot, under the plugin's slug */
        $view = 'modulo-shop::invoice';

        return view($view, [
            'order' => $order,
            'store' => [
                'name' => $settings->get('store_name') ?: SiteSetting::get('site_name', config('app.name')),
                'url' => url('/'),
                'email' => SiteSetting::get('admin_email', config('mail.admin_address')),
                'details' => $settings->get('invoice_details'),
            ],
            'paymentLabel' => app(PaymentService::class)->gateway($order->payment_method)?->label() ?? $order->payment_method,
            'money' => $settings->moneyFormat(),
        ]);
    }
}
