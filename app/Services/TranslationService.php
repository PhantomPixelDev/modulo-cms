<?php

namespace App\Services;

use App\Models\Locale;
use App\Models\TranslationOverride;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Arr;

class TranslationService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    protected const CACHE_TTL = 3600;

    /**
     * Translation domains to load for admin
     */
    protected array $adminDomains = ['common', 'dashboard', 'auth', 'validation'];

    /**
     * Get all translations for the current locale
     */
    public function getTranslations(?string $locale = null): array
    {
        $locale = $locale ?? App::getLocale();
        $cacheKey = "translations:{$locale}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($locale) {
            $translations = $this->loadTranslations($locale);
            return $this->applyOverrides($locale, $translations);
        });
    }

    /**
     * Get translations for admin dashboard
     */
    public function getAdminTranslations(?string $locale = null): array
    {
        $locale = $locale ?? App::getLocale();
        $cacheKey = "translations:admin:{$locale}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($locale) {
            $translations = [];

            foreach ($this->adminDomains as $domain) {
                $domainTranslations = $this->loadDomain($locale, $domain);
                if (!empty($domainTranslations)) {
                    $translations[$domain] = $domainTranslations;
                }
            }

            return $this->applyOverrides($locale, $translations, $this->adminDomains);
        });
    }

    /**
     * Expose admin domains list
     */
    public function getAdminDomains(): array
    {
        return $this->adminDomains;
    }

    /**
     * Load all translations for a locale
     */
    protected function loadTranslations(string $locale): array
    {
        $translations = [];
        $langPath = lang_path($locale);

        if (!File::isDirectory($langPath)) {
            // Fall back to default locale
            $langPath = lang_path(config('app.fallback_locale', 'en'));
        }

        if (!File::isDirectory($langPath)) {
            return $translations;
        }

        // Load all PHP translation files
        foreach (File::files($langPath) as $file) {
            if ($file->getExtension() === 'php') {
                $domain = $file->getFilenameWithoutExtension();
                $translations[$domain] = require $file->getPathname();
            }
        }

        // Also load JSON translations if they exist
        $jsonPath = lang_path("{$locale}.json");
        if (File::exists($jsonPath)) {
            $jsonTranslations = json_decode(File::get($jsonPath), true);
            if (is_array($jsonTranslations)) {
                $translations = array_merge($translations, $jsonTranslations);
            }
        }

        return $translations;
    }

    /**
     * Load a specific translation domain
     */
    protected function loadDomain(string $locale, string $domain): array
    {
        $path = lang_path("{$locale}/{$domain}.php");

        if (!File::exists($path)) {
            // Fall back to default locale
            $path = lang_path(config('app.fallback_locale', 'en') . "/{$domain}.php");
        }

        if (File::exists($path)) {
            return require $path;
        }

        return [];
    }

    /**
     * Get a flattened version of translations for JavaScript
     * Converts nested arrays to dot notation keys
     */
    public function getFlattenedTranslations(?string $locale = null): array
    {
        $translations = $this->getAdminTranslations($locale);
        return Arr::dot($translations);
    }

    /**
     * Get locale information for frontend
     */
    public function getLocaleInfo(): array
    {
        $currentLocale = App::getLocale();
        $localeModel = Locale::findByCode($currentLocale);

        return [
            'current' => $currentLocale,
            'direction' => $localeModel?->direction ?? 'ltr',
            'name' => $localeModel?->name ?? 'English',
            'native_name' => $localeModel?->native_name ?? 'English',
            'available' => Locale::getActive()->map(fn ($l) => [
                'code' => $l->code,
                'name' => $l->name,
                'native_name' => $l->native_name,
                'direction' => $l->direction,
                'is_default' => $l->is_default,
            ])->values()->toArray(),
        ];
    }

    /**
     * Clear translation cache for a specific locale or all locales
     */
    public function clearCache(?string $locale = null): void
    {
        if ($locale) {
            Cache::forget("translations:{$locale}");
            Cache::forget("translations:admin:{$locale}");
        } else {
            // Clear all locale caches
            $locales = Locale::getActive();
            foreach ($locales as $loc) {
                Cache::forget("translations:{$loc->code}");
                Cache::forget("translations:admin:{$loc->code}");
            }
        }
    }

    /**
     * Translate a key with optional replacements
     */
    public function translate(string $key, array $replace = [], ?string $locale = null): string
    {
        return __($key, $replace, $locale);
    }

    /**
     * Apply DB overrides to translation arrays.
     */
    protected function applyOverrides(string $locale, array $translations, ?array $domains = null): array
    {
        $query = TranslationOverride::query()->where('locale', $locale);

        if ($domains) {
            $query->whereIn('domain', $domains);
        }

        $overrides = $query->get();

        foreach ($overrides as $override) {
            $domain = $override->domain;
            if (!array_key_exists($domain, $translations)) {
                $translations[$domain] = [];
            }

            Arr::set($translations[$domain], $override->key, $override->value);
        }

        return $translations;
    }
}
