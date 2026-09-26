<?php

namespace Plugins\ModuloShop\src\Http\Controllers;

use App\Models\User;
use App\Services\ReactTemplateRenderer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Plugins\ModuloShop\src\Models\Order;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;

class AccountController
{
    public function __construct(protected ReactTemplateRenderer $reactRenderer) {}

    /**
     * The signed-in customer's orders: placed while signed in, or as a guest
     * with the same email once that email is verified (so nobody sees
     * another person's orders by registering with their address).
     */
    public function orders(Request $request): JsonResponse|Response
    {
        /** @var User $user */
        $user = $request->user();

        $orders = static::ordersOf($user)
            ->withCount('items')
            ->latest('id')
            ->paginate(15)
            ->through(fn (Order $order) => [
                'order_number' => $order->order_number,
                'created_at' => $order->created_at?->toISOString(),
                'status' => $order->status,
                'status_label' => $order->getStatusLabel(),
                'payment_status' => $order->payment_status,
                'payment_status_label' => $order->getPaymentStatusLabel(),
                'total' => (float) $order->total,
                'currency' => $order->currency,
                'item_count' => (int) $order->getAttribute('items_count'),
                'url' => $order->confirmationUrl(),
            ]);

        if ($request->wantsJson()) {
            return response()->json($orders);
        }

        return $this->reactRenderer->render('Shop/Account', [
            'money' => app(ModuloShopSettings::class)->moneyFormat(),
            'orders' => $orders,
            'customer' => ['name' => $user->name, 'email' => $user->email],
        ]);
    }

    /**
     * @return Builder<Order>
     */
    public static function ordersOf(User $user): Builder
    {
        $verified = $user->hasVerifiedEmail();

        return Order::query()->where(function (Builder $query) use ($user, $verified) {
            $query->where('user_id', $user->id);

            if ($verified) {
                $query->orWhere(fn (Builder $q) => $q->whereNull('user_id')->where('customer_email', $user->email));
            }
        });
    }
}
