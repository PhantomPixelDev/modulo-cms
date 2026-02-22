<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaxonomyTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'taxonomy_id',
        'locale',
        'label',
        'plural_label',
        'description',
    ];

    public function taxonomy(): BelongsTo
    {
        return $this->belongsTo(Taxonomy::class);
    }

    public function scopeForLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }
}
