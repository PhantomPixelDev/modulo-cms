<?php

namespace Plugins\ModuloShop;

use App\Models\PostType;
use App\Plugins\BasePluginServiceProvider;
use App\Services\ShortcodeService;
use Plugins\ModuloShop\database\seeders\ShopSeeder;
use Plugins\ModuloShop\src\Services\CartService;
use Plugins\ModuloShop\src\Services\ModuloShopSettings;
use Plugins\ModuloShop\src\Services\ShopShortcodeService;

class ModuloShopServiceProvider extends BasePluginServiceProvider
{
    protected string $pluginBasePath = __DIR__;

    protected string $pluginSlug = 'modulo-shop';

    public function register()
    {
        $this->app->singleton(ModuloShopSettings::class, function () {
            return new ModuloShopSettings;
        });

        // Register cart service as singleton (session-based)
        $this->app->singleton(CartService::class);

        // Core owns the shortcode registry; only bind it on a core too old to.
        // Re-binding it would drop every shortcode other plugins registered.
        if (! $this->app->bound(ShortcodeService::class)) {
            $this->app->singleton(ShortcodeService::class);
        }
    }

    protected function bootPlugin(): void
    {
        // Register shop shortcodes
        $this->app->singleton(ShopShortcodeService::class, function ($app) {
            return new ShopShortcodeService($app->make(ShortcodeService::class));
        });

        // Initialize shortcodes on boot
        $this->app->make(ShopShortcodeService::class);

        // Add shop features via hooks
        add_action('cms_booted', function () {
            // Ensure product post type exists
            $this->ensureProductPostType();
        });

        // Example filter for currency formatting
        add_filter('format_price', function ($price) {
            $currency = app(ModuloShopSettings::class)->currency();

            return $currency.' '.number_format($price, 2);
        });
    }

    /**
     * Ensure product post type and taxonomies exist
     */
    protected function ensureProductPostType(): void
    {
        // Run seeder if product post type doesn't exist
        if (! PostType::where('name', 'product')->exists()) {
            try {
                $seeder = new ShopSeeder;
                $seeder->setContainer($this->app);
                $seeder->run();
            } catch (\Exception $e) {
                logger()->warning('Failed to seed shop data: '.$e->getMessage());
            }
        }
    }
}
