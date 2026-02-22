<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read string $label
 */

class Taxonomy extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'plural_label',
        'description',
        'slug',
        'is_hierarchical',
        'is_public',
        'post_types',
        'show_in_menu',
        'menu_icon',
        'menu_position',
    ];

    protected $casts = [
        'is_hierarchical' => 'boolean',
        'is_public' => 'boolean',
        'post_types' => 'array',
        'show_in_menu' => 'boolean',
    ];

    public function terms(): HasMany
    {
        return $this->hasMany(TaxonomyTerm::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(TaxonomyTranslation::class);
    }

    public function translation(string $locale): ?TaxonomyTranslation
    {
        return $this->translations()->where('locale', $locale)->first();
    }

    public function translationOrFallback(?string $locale = null): ?TaxonomyTranslation
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

    public function setTranslation(string $locale, array $attributes): TaxonomyTranslation
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

    public function getLocalizedPluralLabel(?string $locale = null): ?string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->plural_label ?? $this->plural_label;
    }

    public function getLocalizedDescription(?string $locale = null): ?string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->description ?? $this->description;
    }

    public function getPostTypesAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }
}
