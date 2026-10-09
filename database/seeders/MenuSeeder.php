<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Route;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $header = [['Home', '/'], ['Articles', '/posts'], ['Announcements', '/infos'], ['Modules', '/modules'], ['About', '/about']];
        // A product type can remain after deactivating the plugin; use the route.
        if (Route::has('shop.index')) {
            $header[] = ['Shop', '/shop'];
        }
        $this->items('main-navigation', 'Main Navigation', 'header', $header);
        $this->items('footer-links', 'Footer Links', 'footer', [
            ['Contact', '/contact'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'],
            ['Documentation', 'https://github.com/PhantomPixelDev/modulo-cms/tree/main/docs'],
        ]);
    }

    private function items(string $slug, string $name, string $location, array $items): void
    {
        $menu = Menu::updateOrCreate(['slug' => $slug], ['name' => $name, 'location' => $location]);
        foreach ($items as $order => [$label, $url]) {
            MenuItem::updateOrCreate(['menu_id' => $menu->id, 'label' => $label], [
                'url' => $url, 'page_slug' => null, 'route_name' => null,
                'order' => $order, 'visible_to' => 'all', 'target' => null,
            ]);
        }
    }
}
