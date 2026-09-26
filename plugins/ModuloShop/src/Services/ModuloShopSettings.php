<?php

namespace Plugins\ModuloShop\src\Services;

use App\Models\Plugin;

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

    public function taxRate(): float
    {
        return (float) $this->get('tax_rate', 0);
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
