<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Plugin;

class ModuloShopSettings
{
    public function get(string $key, mixed $default = null): mixed
    {
        $plugin = Plugin::query()->where('slug', 'modulo-shop')->first();
        $settings = $plugin?->settings ?? [];

        return array_key_exists($key, $settings) ? $settings[$key] : $default;
    }

    public function currency(): string
    {
        return (string) $this->get('currency', 'USD');
    }

    public function taxRate(): float
    {
        return (float) $this->get('tax_rate', 0);
    }

    public function checkoutEnabled(): bool
    {
        return (bool) $this->get('enable_checkout', false);
    }
}
