<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function getPostTypesAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    public function setPostTypesAttribute($value)
    {
        $this->attributes['post_types'] = json_encode($value);
    }
}
