<?php

namespace App\Services\Plugins;

use App\Models\Plugin;
use App\Support\Version;

/**
 * What a plugin needs before it may run: a core version, a PHP version and
 * other plugins, declared in plugin.json.
 *
 *   "requires": {
 *       "core": ">=1.2",
 *       "php": ">=8.2",
 *       "plugins": { "modulo-shop": ">=1.1" }
 *   }
 *
 * The older top-level "min_core_version" is still honoured. Constraints name
 * a minimum (">=1.2", "^1.2" and a bare "1.2" all mean 1.2 or newer), which
 * is all a plugin can meaningfully ask of the site it is installed on.
 */
class PluginRequirements
{
    /**
     * Requirements this site does not meet; empty when the plugin may run.
     *
     * @param  array<string, mixed>  $manifest  plugin.json, or a registry release
     * @param  bool  $needActive  Required plugins must also be active (for activation)
     * @return array<int, string>
     */
    public function unmet(array $manifest, bool $needActive = true): array
    {
        $requires = is_array($manifest['requires'] ?? null) ? $manifest['requires'] : [];
        $unmet = [];

        $core = $requires['core'] ?? ($manifest['min_core_version'] ?? null);
        if (is_string($core) && ($minimum = self::minimumOf($core)) !== null && ! Version::satisfiesMinimum($minimum)) {
            $unmet[] = "Modulo {$minimum} or newer (this is ".Version::current().')';
        }

        $php = $requires['php'] ?? null;
        if (is_string($php) && ($minimum = self::minimumOf($php)) !== null && version_compare(PHP_VERSION, $minimum, '<')) {
            $unmet[] = "PHP {$minimum} or newer (this server runs ".PHP_VERSION.')';
        }

        $plugins = is_array($requires['plugins'] ?? null) ? $requires['plugins'] : [];
        foreach ($plugins as $slug => $constraint) {
            if (! is_string($slug)) {
                continue;
            }

            $minimum = is_string($constraint) ? self::minimumOf($constraint) : null;
            $installed = Plugin::where('slug', $slug)->first();
            $label = $slug.($minimum !== null ? " {$minimum} or newer" : '');

            if ($installed === null) {
                $unmet[] = "the {$label} plugin";
            } elseif ($minimum !== null && version_compare(Version::normalize((string) $installed->version), $minimum, '<')) {
                $unmet[] = "the {$label} plugin (installed: {$installed->version})";
            } elseif ($needActive && ! $installed->is_active) {
                $unmet[] = "the {$slug} plugin to be active";
            }
        }

        return $unmet;
    }

    /**
     * Active plugins that declare they need this one.
     *
     * @return array<int, string> Their names
     */
    public function dependents(string $slug): array
    {
        return Plugin::query()->active()->where('slug', '!=', $slug)->get()
            ->filter(fn (Plugin $plugin) => is_array($plugin->requires['plugins'] ?? null)
                && array_key_exists($slug, $plugin->requires['plugins']))
            ->map(fn (Plugin $plugin) => $plugin->name)
            ->values()
            ->all();
    }

    public static function minimumOf(string $constraint): ?string
    {
        return preg_match('/(\d+(?:\.\d+){0,2})/', $constraint, $m) === 1 ? $m[1] : null;
    }

    /**
     * The "requires" block as stored on the plugin row.
     *
     * @param  array<string, mixed>  $manifest
     * @return array<string, mixed>|null
     */
    public static function fromManifest(array $manifest): ?array
    {
        $requires = $manifest['requires'] ?? null;

        return is_array($requires) && $requires !== [] ? $requires : null;
    }
}
