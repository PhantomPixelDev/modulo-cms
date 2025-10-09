<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ThemeMakeCommand extends Command
{
    protected $signature = 'theme:make {name : The theme name}';
    protected $description = 'Create a new React theme scaffold';

    public function handle(): int
    {
        $name = $this->argument('name');
        $slug = Str::slug($name);

        $themePath = resource_path("themes/{$slug}");

        if (File::exists($themePath)) {
            $this->error("Theme directory already exists: {$themePath}");
            return self::FAILURE;
        }

        $this->info("Creating React theme: {$name}");
        $this->newLine();

        try {
            // Create directory structure
            File::makeDirectory($themePath, 0755, true);
            File::makeDirectory("{$themePath}/assets/css", 0755, true);
            File::makeDirectory("{$themePath}/assets/js", 0755, true);
            File::makeDirectory("{$themePath}/assets/images", 0755, true);
            File::makeDirectory("{$themePath}/components", 0755, true);
            File::makeDirectory("{$themePath}/components/partials", 0755, true);
            
            $this->createReactScaffold($themePath, $name, $slug);

            $this->info("✓ Theme scaffold created successfully!");
            $this->newLine();
            $this->line("Theme location: {$themePath}");
            $this->line("Next steps:");
            $this->line("  1. Edit {$themePath}/theme.json to configure your theme");
            $this->line("  2. Add your templates and assets");
            $this->line("  3. Run: php artisan theme:install {$slug}");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Failed to create theme: " . $e->getMessage());
            return self::FAILURE;
        }
    }

    protected function createReactScaffold(string $path, string $name, string $slug): void
    {
        // Create theme.json
        $themeJson = [
            'name' => $name,
            'slug' => $slug,
            'version' => '1.0.0',
            'description' => "A modern React theme for Modulo CMS",
            'author' => config('app.name'),
            'author_url' => '',
            'tags' => ['react', 'modern'],
            'supports' => [
                'post_thumbnails' => true,
                'menus' => true,
                'responsive' => true,
            ],
            'templates' => [
                'layout' => ['component' => 'components/Layout.tsx'],
                'post' => ['component' => 'components/Post.tsx'],
                'posts' => ['component' => 'components/Posts.tsx'],
                'page' => ['component' => 'components/Page.tsx'],
                'index' => ['component' => 'components/Index.tsx'],
            ],
            'menus' => [
                'primary' => 'Primary Navigation',
                'footer' => 'Footer Links',
            ],
            'customizer' => [
                'colors' => [
                    'primary' => [
                        'label' => 'Primary Color',
                        'type' => 'color',
                        'default' => '#3b82f6',
                    ],
                ],
            ],
        ];

        File::put("{$path}/theme.json", json_encode($themeJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // Create basic React components
        $this->createReactComponent("{$path}/components/Layout.tsx", 'Layout');
        $this->createReactComponent("{$path}/components/Post.tsx", 'Post');
        $this->createReactComponent("{$path}/components/Posts.tsx", 'Posts');
        $this->createReactComponent("{$path}/components/Page.tsx", 'Page');
        $this->createReactComponent("{$path}/components/Index.tsx", 'Index');

        // Create basic CSS
        File::put("{$path}/assets/css/theme.css", "/* Theme styles */\n");
        
        // Create README
        File::put("{$path}/README.md", "# {$name}\n\nA React-based theme for Modulo CMS.\n");
    }


    protected function createReactComponent(string $path, string $name): void
    {
        $component = <<<TSX
import React from 'react';

interface {$name}Props {
    // Add your props here
}

export default function {$name}(props: {$name}Props) {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold">{$name} Component</h1>
            <p className="mt-4">Edit this component to build your theme.</p>
        </div>
    );
}
TSX;

        File::put($path, $component);
    }

}
