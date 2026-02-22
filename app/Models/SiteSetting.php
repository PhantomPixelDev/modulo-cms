<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use App\Models\Locale;
use App\Models\SiteSettingTranslation;

class SiteSetting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'autoload',
    ];

    protected $casts = [
        'autoload' => 'boolean',
    ];

    protected static string $cacheKey = 'site_settings.all';
    protected static int $cacheTtl = 3600;
    protected static array $translatableKeys = [
        'site_name',
        'site_tagline',
        'meta_title_suffix',
        'meta_description',
        'maintenance_message',
    ];

    /**
     * Get a setting value by key
     */
    public function translations(): HasMany
    {
        return $this->hasMany(SiteSettingTranslation::class);
    }

    public static function translatableKeys(): array
    {
        return static::$translatableKeys;
    }

    public static function isTranslatableKey(string $key): bool
    {
        return in_array($key, static::$translatableKeys, true);
    }

    public static function get(string $key, mixed $default = null, ?string $locale = null): mixed
    {
        $settings = static::getAllCached();
        $locale = $locale ?: app()->getLocale();
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', 'en');

        // Try exact match first
        if (isset($settings[$key])) {
            $entry = $settings[$key];

            if ($locale && static::isTranslatableKey($key)) {
                $translated = static::getTranslationValue($entry['id'], $entry['type'], $locale);
                if ($translated !== null) {
                    return $translated;
                }

                if ($locale !== $defaultLocale) {
                    $fallbackTranslated = static::getTranslationValue($entry['id'], $entry['type'], $defaultLocale);
                    if ($fallbackTranslated !== null) {
                        return $fallbackTranslated;
                    }
                }
            }

            return static::castValue($entry['value'], $entry['type']);
        }

        // Try grouped keys like 'reading.show_on_front'
        foreach ($settings as $settingKey => $data) {
            if ($settingKey === $key || "{$data['group']}.{$settingKey}" === $key) {
                if ($locale && static::isTranslatableKey($settingKey)) {
                    $translated = static::getTranslationValue($data['id'], $data['type'], $locale);
                    if ($translated !== null) {
                        return $translated;
                    }

                    if ($locale !== $defaultLocale) {
                        $fallbackTranslated = static::getTranslationValue($data['id'], $data['type'], $defaultLocale);
                        if ($fallbackTranslated !== null) {
                            return $fallbackTranslated;
                        }
                    }
                }

                return static::castValue($data['value'], $data['type']);
            }
        }

        // Fallback to database for non-autoloaded settings
        // Check if table exists (for fresh installs)
        if (!Schema::hasTable('site_settings')) {
            return $default;
        }

        $driver = \DB::getDriverName();
        $concatExpr = $driver === 'pgsql'
            ? 'CONCAT("group", \'.\', "key")'
            : 'CONCAT(`group`, \'.\', `key`)';

        $setting = static::where('key', $key)
            ->orWhereRaw("{$concatExpr} = ?", [$key])
            ->first();

        if ($setting) {
            if ($locale && static::isTranslatableKey($setting->key)) {
                $translated = static::getTranslationValue($setting->id, $setting->type, $locale);
                if ($translated !== null) {
                    return $translated;
                }

                if ($locale !== $defaultLocale) {
                    $fallbackTranslated = static::getTranslationValue($setting->id, $setting->type, $defaultLocale);
                    if ($fallbackTranslated !== null) {
                        return $fallbackTranslated;
                    }
                }
            }

            return static::castValue($setting->value, $setting->type);
        }

        return $default;
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, mixed $value, string $group = 'general', string $type = 'string'): void
    {
        $storedValue = static::prepareValue($value, $type);

        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $storedValue,
                'group' => $group,
                'type' => $type,
            ]
        );

        static::clearCache();
    }

    /**
     * Set multiple settings at once
     */
    public static function setMany(array $settings, string $group = 'general'): void
    {
        foreach ($settings as $key => $data) {
            $value = is_array($data) && isset($data['value']) ? $data['value'] : $data;
            $type = is_array($data) && isset($data['type']) ? $data['type'] : 'string';
            
            static::set($key, $value, $group, $type);
        }
    }

    /**
     * Get all settings for a group
     */
    public static function getGroup(string $group, ?string $locale = null): array
    {
        $settings = static::getAllCached();
        $grouped = [];

        foreach ($settings as $key => $data) {
            if ($data['group'] === $group) {
                $grouped[$key] = static::get($key, static::castValue($data['value'], $data['type']), $locale);
            }
        }

        return $grouped;
    }

    /**
     * Get all autoloaded settings (cached)
     */
    public static function getAllCached(): array
    {
        // Check if table exists (for fresh installs)
        if (!Schema::hasTable('site_settings')) {
            return [];
        }

        return Cache::remember(static::$cacheKey, static::$cacheTtl, function () {
            return static::where('autoload', true)
                ->get()
                ->keyBy('key')
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'value' => $item->value,
                    'type' => $item->type,
                    'group' => $item->group,
                ])
                ->toArray();
        });
    }

    public static function setTranslation(string $key, string $locale, mixed $value, string $group = 'general', string $type = 'string'): void
    {
        $setting = static::firstOrCreate(
            ['key' => $key],
            [
                'group' => $group,
                'value' => static::prepareValue($value, $type),
                'type' => $type,
            ]
        );

        SiteSettingTranslation::updateOrCreate(
            [
                'site_setting_id' => $setting->id,
                'locale' => $locale,
            ],
            [
                'value' => static::prepareValue($value, $type),
            ]
        );
    }

    protected static function getTranslationValue(int $settingId, string $type, string $locale): mixed
    {
        $translation = SiteSettingTranslation::where('site_setting_id', $settingId)
            ->where('locale', $locale)
            ->first();

        return $translation ? static::castValue($translation->value, $type) : null;
    }

    /**
     * Clear the settings cache
     */
    public static function clearCache(): void
    {
        Cache::forget(static::$cacheKey);
    }

    /**
     * Get default settings structure
     */
    public static function getDefaults(): array
    {
        return [
            'general' => [
                'site_name' => ['value' => config('app.name', 'Modulo CMS'), 'type' => 'string'],
                'site_tagline' => ['value' => '', 'type' => 'string'],
                'site_url' => ['value' => config('app.url', 'http://localhost'), 'type' => 'string'],
                'admin_email' => ['value' => '', 'type' => 'string'],
                'timezone' => ['value' => config('app.timezone', 'UTC'), 'type' => 'string'],
                'date_format' => ['value' => 'F j, Y', 'type' => 'string'],
                'time_format' => ['value' => 'g:i a', 'type' => 'string'],
            ],
            'reading' => [
                'posts_per_page' => ['value' => 10, 'type' => 'integer'],
                'show_on_front' => ['value' => 'posts', 'type' => 'string'], // posts, page
                'front_page_id' => ['value' => null, 'type' => 'integer'],
                'posts_page_id' => ['value' => null, 'type' => 'integer'],
                'feed_limit' => ['value' => 10, 'type' => 'integer'],
            ],
            'writing' => [
                'default_post_status' => ['value' => 'draft', 'type' => 'string'],
                'default_post_type' => ['value' => 'post', 'type' => 'string'],
            ],
            'permalinks' => [
                'permalink_structure' => ['value' => '/%postname%/', 'type' => 'string'],
                'category_base' => ['value' => 'category', 'type' => 'string'],
                'tag_base' => ['value' => 'tag', 'type' => 'string'],
            ],
            'seo' => [
                'meta_title_suffix' => ['value' => '', 'type' => 'string'],
                'meta_description' => ['value' => '', 'type' => 'string'],
                'robots_txt' => ['value' => "User-agent: *\nAllow: /", 'type' => 'string'],
                'indexnow_key' => ['value' => '', 'type' => 'string'],
                'google_site_verification' => ['value' => '', 'type' => 'string'],
                'bing_site_verification' => ['value' => '', 'type' => 'string'],
            ],
            'social' => [
                'facebook_url' => ['value' => '', 'type' => 'string'],
                'twitter_url' => ['value' => '', 'type' => 'string'],
                'instagram_url' => ['value' => '', 'type' => 'string'],
                'linkedin_url' => ['value' => '', 'type' => 'string'],
                'youtube_url' => ['value' => '', 'type' => 'string'],
                'github_url' => ['value' => '', 'type' => 'string'],
            ],
            'analytics' => [
                'google_analytics_id' => ['value' => '', 'type' => 'string'],
                'gtm_container_id' => ['value' => '', 'type' => 'string'],
            ],
            'media' => [
                'max_upload_size' => ['value' => 10, 'type' => 'integer'], // MB
                'allowed_mime_types' => ['value' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'], 'type' => 'json'],
                'image_quality' => ['value' => 85, 'type' => 'integer'],
            ],
            'advanced' => [
                'maintenance_mode' => ['value' => false, 'type' => 'boolean'],
                'maintenance_message' => ['value' => 'We are currently undergoing maintenance. Please check back soon.', 'type' => 'string'],
                'enable_comments' => ['value' => false, 'type' => 'boolean'],
                'registration_enabled' => ['value' => false, 'type' => 'boolean'],
            ],
        ];
    }

    /**
     * Seed default settings if they don't exist
     */
    public static function seedDefaults(): void
    {
        $defaults = static::getDefaults();

        foreach ($defaults as $group => $settings) {
            foreach ($settings as $key => $data) {
                if (!static::where('key', $key)->exists()) {
                    static::create([
                        'group' => $group,
                        'key' => $key,
                        'value' => static::prepareValue($data['value'], $data['type']),
                        'type' => $data['type'],
                        'autoload' => true,
                    ]);
                }
            }
        }

        static::clearCache();
    }

    /**
     * Cast value based on type
     */
    protected static function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $value,
            'float' => (float) $value,
            'json', 'array' => is_string($value) ? json_decode($value, true) : $value,
            default => $value,
        };
    }

    /**
     * Prepare value for storage
     */
    protected static function prepareValue(mixed $value, string $type): ?string
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json', 'array' => is_string($value) ? $value : json_encode($value),
            default => (string) $value,
        };
    }
}
