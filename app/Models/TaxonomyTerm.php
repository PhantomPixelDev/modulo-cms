<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property-read string $name
 */

class TaxonomyTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'taxonomy_id',
        'name',
        'slug',
        'description',
        'parent_id',
        'term_order',
        'meta_title',
        'meta_description',
        'meta_data',
    ];

    protected $casts = [
        'meta_data' => 'array',
    ];

    public function taxonomy(): BelongsTo
    {
        return $this->belongsTo(Taxonomy::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(TaxonomyTerm::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(TaxonomyTerm::class, 'parent_id');
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_taxonomy_terms')
                    ->withTimestamps();
    }

    public function translations(): HasMany
    {
        return $this->hasMany(TaxonomyTermTranslation::class);
    }

    public function translation(string $locale): ?TaxonomyTermTranslation
    {
        return $this->translations()->where('locale', $locale)->first();
    }

    public function translationOrFallback(?string $locale = null): ?TaxonomyTermTranslation
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

    public function setTranslation(string $locale, array $attributes): TaxonomyTermTranslation
    {
        return $this->translations()->updateOrCreate(
            ['locale' => $locale],
            $attributes
        );
    }

    public function availableLocales(): array
    {
        return $this->translations()->pluck('locale')->toArray();
    }

    public function getLocalizedName(?string $locale = null): string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->name ?? $this->name;
    }

    public function getLocalizedSlug(?string $locale = null): string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->slug ?? $this->slug;
    }

    public function getLocalizedDescription(?string $locale = null): ?string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->description ?? $this->description;
    }

    public function getLocalizedMetaTitle(?string $locale = null): ?string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->meta_title ?? $this->meta_title;
    }

    public function getLocalizedMetaDescription(?string $locale = null): ?string
    {
        $translation = $this->translationOrFallback($locale);

        return $translation?->meta_description ?? $this->meta_description;
    }

    public function getLocalizedMetaData(?string $locale = null): array
    {
        $translation = $this->translationOrFallback($locale);

        if ($translation && is_array($translation->meta_data)) {
            return $translation->meta_data;
        }

        return $this->meta_data ?? [];
    }

    public function getMetaDataAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    // Scopes for filtering
    public function scopeByTaxonomy($query, $taxonomyId)
    {
        return $query->where('taxonomy_id', $taxonomyId);
    }

    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }
}
