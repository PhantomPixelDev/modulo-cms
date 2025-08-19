<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Header menu
        $header = Menu::updateOrCreate(
            ['slug' => 'main-navigation'],
            ['name' => 'Main Navigation', 'location' => 'header', 'description' => 'Primary site navigation']
        );

        $this->ensureItems($header, [
            ['label' => 'Home', 'page_slug' => '/', 'order' => 0],
            ['label' => 'Posts', 'page_slug' => 'posts', 'order' => 1],
            ['label' => 'About', 'page_slug' => 'about', 'order' => 2],
            ['label' => 'Contact', 'page_slug' => 'contact', 'order' => 3, 'visible_to' => 'all'],
        ]);

        // Footer menu
        $footer = Menu::updateOrCreate(
            ['slug' => 'footer-links'],
            ['name' => 'Footer Links', 'location' => 'footer', 'description' => 'Footer links']
        );

        $this->ensureItems($footer, [
            ['label' => 'Privacy', 'page_slug' => 'privacy', 'order' => 0],
            ['label' => 'Terms', 'page_slug' => 'terms', 'order' => 1],
            ['label' => 'Dashboard', 'route_name' => 'dashboard', 'order' => 2, 'visible_to' => 'auth'],
        ]);
    }

    private function ensureItems(Menu $menu, array $items): void
    {
        foreach ($items as $i => $data) {
            MenuItem::firstOrCreate(
                [
                    'menu_id' => $menu->id,
                    'label' => $data['label'],
                ],
                [
                    'url' => $data['url'] ?? null,
                    'page_slug' => $data['page_slug'] ?? null,
                    'route_name' => $data['route_name'] ?? null,
                    'order' => $data['order'] ?? $i,
                    'visible_to' => $data['visible_to'] ?? 'all',
                    'target' => $data['target'] ?? null,
                ]
            );
        }
    }
}
