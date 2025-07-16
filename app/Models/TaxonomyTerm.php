<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function getMetaDataAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    public function setMetaDataAttribute($value)
    {
        $this->attributes['meta_data'] = json_encode($value);
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
