<?php

namespace App\Console\Commands;

use App\Models\Plugin;
use App\Services\PluginManager;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Copies plugins' public files into public/plugins.
 *
 * Necessary rather than tidy: in production the nginx image bakes public/ in at
 * build time, so anything a plugin writes there at runtime is invisible to the
 * web server unless it lands on the shared volume this publishes to.
 *
 * PHP is deliberately never copied. A plugin's PHP runs through the
 * application, never as a file under the document root.
 */
class PluginPublishAssetsCommand extends Command
{
    protected $signature = 'plugin:publish-assets {slug? : Publish just this plugin}';

    protected $description = "Publish plugins' public assets so the web server can serve them";

    /** Anything not on this list stays out of the document root. */
    protected const PUBLISHABLE = [
        'js', 'mjs', 'css', 'map',
        'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico',
        'woff', 'woff2', 'ttf', 'eot', 'otf',
        'json', 'txt',
    ];

    public function handle(PluginManager $manager): int
    {
        $manager->syncDiscoveredPluginsCached();

        $plugins = Plugin::query()
            ->when($this->argument('slug'), fn ($q) => $q->where('slug', $this->argument('slug')))
            ->get();

        $published = 0;

        foreach ($plugins as $plugin) {
            $source = $this->sourceFor($plugin->slug);

            if ($source === null) {
                continue;
            }

            $destination = public_path('plugins/'.$plugin->slug);
            File::ensureDirectoryExists($destination);

            $copied = $this->copyAllowed($source, $destination);

            if ($copied > 0) {
                $published++;
                $this->line(sprintf('  %s: %d file(s)', $plugin->slug, $copied));
            }
        }

        $this->info($published === 0 ? 'No plugin assets to publish.' : 'Published assets for '.$published.' plugin(s).');

        return self::SUCCESS;
    }

    protected function sourceFor(string $slug): ?string
    {
        foreach (app(PluginManager::class)->pluginDirectories() as $directory) {
            $manifest = $directory.'/plugin.json';

            if (! File::exists($manifest)) {
                continue;
            }

            $decoded = json_decode((string) File::get($manifest), true);

            if (is_array($decoded) && ($decoded['slug'] ?? null) === $slug) {
                foreach (['resources/dist', 'public', 'resources/assets'] as $candidate) {
                    if (File::isDirectory($directory.'/'.$candidate)) {
                        return $directory.'/'.$candidate;
                    }
                }

                return null;
            }
        }

        return null;
    }

    protected function copyAllowed(string $source, string $destination): int
    {
        $copied = 0;

        foreach (File::allFiles($source) as $file) {
            if (! in_array(strtolower($file->getExtension()), self::PUBLISHABLE, true)) {
                continue;
            }

            $target = $destination.'/'.$file->getRelativePathname();
            File::ensureDirectoryExists(dirname($target));
            File::copy($file->getRealPath(), $target);
            $copied++;
        }

        return $copied;
    }
}
