<?php

namespace Plugins\ModuloShop\src\Services;

use Plugins\ModuloShop\src\Models\Coupon;

/**
 * Order totals: the one place discount, shipping and tax are worked out, so
 * the cart, the checkout page and the saved order always agree.
 *
 * Order of operations: the coupon discounts the goods, shipping is priced on
 * what is left (free-shipping thresholds count after the discount), and tax is
 * charged on goods plus shipping. With prices entered including tax, the tax
 * is the share already inside that amount instead of being added on top.
 */
class PriceCalculator
{
    public function __construct(protected ModuloShopSettings $settings) {}

    /**
     * @return array{
     *     subtotal: float, discount: float, shipping: float, tax: float, total: float,
     *     tax_rate: float, prices_include_tax: bool,
     *     shipping_method: string|null, shipping_method_name: string|null,
     *     shipping_methods: list<array{id: string, name: string, price: float, free_over: float|null, cost: float}>,
     *     coupon: array{code: string, type: string, amount: float, description: string|null}|null,
     *     coupon_error: string|null
     * }
     */
    public function calculate(float $subtotal, ?string $shippingMethodId = null, ?Coupon $coupon = null): array
    {
        $subtotal = round(max(0.0, $subtotal), 2);

        $couponError = $coupon?->unusableReason($subtotal);
        if ($couponError !== null) {
            $coupon = null;
        }

        $discount = 0.0;
        if ($coupon?->type === Coupon::TYPE_PERCENT) {
            $discount = $subtotal * min(100.0, max(0.0, $coupon->amount)) / 100;
        } elseif ($coupon?->type === Coupon::TYPE_FIXED) {
            $discount = min($subtotal, max(0.0, $coupon->amount));
        }
        $discount = round($discount, 2);
        $goods = round($subtotal - $discount, 2);

        $freeShipping = $coupon?->type === Coupon::TYPE_FREE_SHIPPING;
        $methods = array_map(function (array $method) use ($goods, $freeShipping) {
            $free = $freeShipping || ($method['free_over'] !== null && $goods >= $method['free_over']);

            return [...$method, 'cost' => $free ? 0.0 : $method['price']];
        }, $this->settings->shippingMethods());

        $selected = null;
        foreach ($methods as $method) {
            if ($method['id'] === $shippingMethodId) {
                $selected = $method;
            }
        }
        $selected ??= $methods[0] ?? null;
        $shipping = $subtotal > 0 ? (float) ($selected['cost'] ?? 0.0) : 0.0;

        $rate = $this->settings->taxRate() / 100;
        $inclusive = $this->settings->pricesIncludeTax();
        $taxable = $goods + $shipping;

        if ($inclusive) {
            $tax = $rate > 0 ? round($taxable - $taxable / (1 + $rate), 2) : 0.0;
            $total = round($taxable, 2);
        } else {
            $tax = round($taxable * $rate, 2);
            $total = round($taxable + $tax, 2);
        }

        return [
            'subtotal' => $subtotal,
            'discount' => $discount,
            'shipping' => round($shipping, 2),
            'tax' => $tax,
            'total' => $total,
            'tax_rate' => $this->settings->taxRate(),
            'prices_include_tax' => $inclusive,
            'shipping_method' => $selected['id'] ?? null,
            'shipping_method_name' => $selected['name'] ?? null,
            'shipping_methods' => $methods,
            'coupon' => $coupon ? [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'amount' => $coupon->amount,
                'description' => $coupon->description,
            ] : null,
            'coupon_error' => $couponError,
        ];
    }
}
