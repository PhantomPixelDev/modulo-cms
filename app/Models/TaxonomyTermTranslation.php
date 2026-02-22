<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxonomyTermTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'taxonomy_term_id',
        'locale',
        'name',
        'slug',
        'description',
        'meta_title',
        'meta_description',
        'meta_data',
    ];

    protected $casts = [
        'meta_data' => 'array',
    ];

    public function term(): BelongsTo
    {
        return $this->belongsTo(TaxonomyTerm::class, 'taxonomy_term_id');
    }

    public function scopeForLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }
}
