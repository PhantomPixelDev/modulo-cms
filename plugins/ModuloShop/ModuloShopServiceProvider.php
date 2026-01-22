<?php

namespace Plugins\ModuloShop;

use App\Models\Plugin;
use App\Plugins\BasePluginServiceProvider;
use App\Services\ShortcodeService;
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
            return new ModuloShopSettings();
        });

        // Register cart service as singleton (session-based)
        $this->app->singleton(CartService::class);

        // Register shortcode service as singleton
        $this->app->singleton(ShortcodeService::class);
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
        add_action('cms_booted', function() {
            // Ensure product post type exists
            $this->ensureProductPostType();
        });

        // Example filter for currency formatting
        add_filter('format_price', function($price) {
            $currency = app(ModuloShopSettings::class)->currency();
            return $currency . ' ' . number_format($price, 2);
        });
    }

    /**
     * Ensure product post type and taxonomies exist
     */
    protected function ensureProductPostType(): void
    {
        // Run seeder if product post type doesn't exist
        if (!\App\Models\PostType::where('name', 'product')->exists()) {
            try {
                $seeder = new \Plugins\ModuloShop\database\seeders\ShopSeeder();
                $seeder->setContainer($this->app);
                $seeder->run();
            } catch (\Exception $e) {
                logger()->warning('Failed to seed shop data: ' . $e->getMessage());
            }
        }
    }
}
