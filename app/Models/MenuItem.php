<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_id', 'parent_id', 'label', 'url', 'page_slug', 'route_name',
        'order', 'visible_to', 'target'
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MenuItem::class, 'parent_id')
            ->orderBy('order')
            ->with(['translations', 'children']);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(MenuItemTranslation::class);
    }

    public function translation(string $locale): ?MenuItemTranslation
    {
        return $this->translations()->where('locale', $locale)->first();
    }

    public function translationOrFallback(?string $locale = null): ?MenuItemTranslation
    {
        $locale = $locale ?? app()->getLocale();
        $translation = $this->translation($locale);

        if (!$translation) {
            $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', 'en');
            if ($locale !== $defaultLocale) {
                $translation = $this->translation($defaultLocale);
            }
        }

        return $translation;
    }

    public function setTranslation(string $locale, array $attributes): MenuItemTranslation
    {
        return $this->translations()->updateOrCreate(
            ['locale' => $locale],
            $attributes
        );
    }

    public function getLocalizedLabel(?string $locale = null): string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->label ?? $this->label;
    }

    public function getLocalizedUrl(?string $locale = null): ?string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->url ?? $this->url;
    }

    public function resolveUrl(?string $locale = null): string
    {
        $localizedUrl = $this->getLocalizedUrl($locale);
        if (!empty($localizedUrl)) {
            return $localizedUrl;
        }

        if (!empty($this->page_slug)) {
            return url('/' . ltrim($this->page_slug, '/'));
        }

        if (!empty($this->route_name)) {
            try {
                return route($this->route_name);
            } catch (\Throwable $e) {
                return '#';
            }
        }

        return '#';
    }

    public function buildLocalizationMap(): array
    {
        $defaultLocale = Locale::getDefault()?->code ?? config('app.fallback_locale', config('app.locale', 'en'));
        $map = [
            $defaultLocale => [
                'label' => $this->label,
                'url' => $this->resolveUrl($defaultLocale),
            ],
        ];

        $translations = $this->relationLoaded('translations')
            ? $this->translations
            : $this->translations()->get();

        foreach ($translations as $translation) {
            if (!$translation->locale) {
                continue;
            }

            $map[$translation->locale] = [
                'label' => $translation->label ?? $this->label,
                'url' => $this->resolveUrl($translation->locale),
            ];
        }

        return array_filter($map, fn ($entry) => !empty($entry['label']) || !empty($entry['url']));
    }
}
