<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Plugin;
use Illuminate\Support\Str;

class ModuloShopSettings
{
    protected ?array $settings = null;

    public function get(string $key, mixed $default = null): mixed
    {
        // Loaded once per instance instead of one query per lookup
        $this->settings ??= Plugin::query()->where('slug', 'modulo-shop')->first()?->settings ?? [];

        return array_key_exists($key, $this->settings) ? $this->settings[$key] : $default;
    }

    public function currency(): string
    {
        return (string) $this->get('currency', 'USD');
    }

    /**
     * How the storefront writes amounts, from the Currency tab of the shop
     * settings.
     *
     * @return array{currency: string, position: string, thousand: string, decimal: string, decimals: int}
     */
    public function moneyFormat(): array
    {
        return [
            'currency' => $this->currency(),
            'position' => $this->get('currency_position', 'before') === 'after' ? 'after' : 'before',
            'thousand' => (string) $this->get('thousand_separator', ','),
            'decimal' => (string) $this->get('decimal_separator', '.'),
            'decimals' => max(0, min(4, (int) $this->get('decimals', 2))),
        ];
    }

    /** Percent, e.g. 21 for 21%. */
    public function taxRate(): float
    {
        return max(0.0, (float) $this->get('tax_rate', 0));
    }

    /** Whether product prices already contain tax (EU style) or tax is added on top. */
    public function pricesIncludeTax(): bool
    {
        return (bool) $this->get('prices_include_tax', false);
    }

    /**
     * Shipping methods as the checkout offers them.
     *
     * Stored as rows of {name, price, free_over}. Older installs have a plain
     * "Standard, Express" string; those become free methods of those names
     * rather than disappearing.
     *
     * @return list<array{id: string, name: string, price: float, free_over: float|null}>
     */
    public function shippingMethods(): array
    {
        $raw = $this->get('shipping_methods', []);

        if (is_string($raw)) {
            $raw = array_map(fn ($name) => ['name' => $name, 'price' => 0], explode(',', $raw));
        }

        $methods = [];
        foreach (is_array($raw) ? $raw : [] as $row) {
            $name = trim((string) (is_array($row) ? ($row['name'] ?? '') : $row));
            if ($name === '') {
                continue;
            }

            $id = Str::slug($name) ?: 'method-'.count($methods);
            $freeOver = is_array($row) && isset($row['free_over']) && $row['free_over'] !== '' ? (float) $row['free_over'] : null;

            $methods[] = [
                'id' => $id,
                'name' => $name,
                'price' => is_array($row) ? max(0.0, round((float) ($row['price'] ?? 0), 2)) : 0.0,
                'free_over' => $freeOver,
            ];
        }

        return $methods;
    }

    /**
     * On unless switched off: stores whose settings lost the key (an old
     * settings form replaced the whole array) must keep selling.
     */
    public function checkoutEnabled(): bool
    {
        return (bool) $this->get('enable_checkout', true);
    }
}
