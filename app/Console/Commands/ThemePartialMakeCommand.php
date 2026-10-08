<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ThemePartialMakeCommand extends Command
{
    protected $signature = 'theme:partial {theme : Bundled theme slug} {name : Shortcode name, e.g. contact-card}';

    protected $description = 'Create and register a React content partial in a bundled theme';

    public function handle(): int
    {
        $theme = (string) $this->argument('theme');
        $name = (string) $this->argument('name');
        if (! preg_match('/^[a-z0-9-]+$/D', $theme) || ! preg_match('/^[a-z][a-z0-9-]*$/D', $name)) {
            $this->error('Use lowercase names with numbers and hyphens; partial names must start with a letter.');

            return self::FAILURE;
        }
        $directory = resource_path('themes/'.$theme);
        $manifest = $directory.'/theme.json';
        if (! File::isFile($manifest)) {
            $this->error('Bundled theme not found. Runtime themes reuse their bundled parent components.');

            return self::FAILURE;
        }
        $config = json_decode(File::get($manifest), true);
        if (! is_array($config) || ! is_array($config['partials'] ?? [])) {
            $this->error('Invalid theme.json.');

            return self::FAILURE;
        }
        $component = Str::studly($name);
        $path = 'components/partials/'.$component.'.tsx';
        if (isset($config['partials'][$name]) || File::exists($directory.'/'.$path)) {
            $this->error('Partial already exists; no files were changed.');

            return self::FAILURE;
        }
        $source = <<<TSX
import type { ThemePartialProps } from '@/theme-partials';

export default function {$component}({ attributes, children }: ThemePartialProps) {
    return (
        <section className="my-6 rounded-xl border p-5">
            {attributes.title && <h2>{attributes.title}</h2>}
            {children}
        </section>
    );
}

TSX;
        File::ensureDirectoryExists(dirname($directory.'/'.$path));
        File::put($directory.'/'.$path, $source);
        $config['partials'][$name] = ['component' => $path, 'shortcode' => true, 'defaults' => ['title' => '']];
        File::put($manifest, json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n");
        $this->info("Created {$path} and registered '{$name}'.");
        $this->line('Run npm run build, then use:');
        $this->line('[partial name="'.$name.'" title="Your title"]Your content[/partial]');

        return self::SUCCESS;
    }
}
