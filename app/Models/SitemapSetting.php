<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use App\Models\Locale;
use App\Models\SitemapSettingTranslation;

class SitemapSetting extends Model
{
    use HasFactory;

    protected $table = 'sitemap_settings';

    protected $fillable = [
        'included_post_type_ids',
        'include_taxonomies',
        'enable_cache',
        'cache_ttl',
        'last_generated_at',
    ];

    protected $casts = [
        'included_post_type_ids' => 'array',
        'include_taxonomies' => 'boolean',
        'enable_cache' => 'boolean',
        'cache_ttl' => 'integer',
        'last_generated_at' => 'datetime',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(SitemapSettingTranslation::class);
    }

    public function getLocalizedConfig(?string $locale = null): array
    {
        $config = $this->attributesToArray();
        if (!array_key_exists('custom_urls', $config)) {
            $config['custom_urls'] = [];
        }
        $locale = $locale ?: app()->getLocale();

        if (!$locale) {
            return $config;
        }

        $translation = $this->translations()->where('locale', $locale)->first();

        if (!$translation) {
            $default = $this->resolveDefaultLocale();
            if ($default && $default !== $locale) {
                $translation = $this->translations()->where('locale', $default)->first();
            }
        }

        if ($translation) {
            if ($translation->included_post_type_ids !== null) {
                $config['included_post_type_ids'] = $translation->included_post_type_ids;
            }
            if ($translation->include_taxonomies !== null) {
                $config['include_taxonomies'] = $translation->include_taxonomies;
            }
            if ($translation->custom_urls !== null) {
                $config['custom_urls'] = $translation->custom_urls;
            }
        }

        return $config;
    }

    public function setLocalizedConfig(string $locale, array $attributes): void
    {
        $this->translations()->updateOrCreate(
            ['locale' => $locale],
            [
                'included_post_type_ids' => $attributes['included_post_type_ids'] ?? null,
                'include_taxonomies' => $attributes['include_taxonomies'] ?? null,
                'custom_urls' => $attributes['custom_urls'] ?? null,
            ]
        );
    }

    protected function resolveDefaultLocale(): ?string
    {
        if (!Schema::hasTable('locales')) {
            return config('app.fallback_locale');
        }

        return Locale::getDefault()?->code ?? config('app.fallback_locale');
    }
}
