<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'label',
        'plural_label',
        'description',
        'route_prefix',
        'single_template_id',
        'archive_template_id',
        'has_taxonomies',
        'has_featured_image',
        'has_excerpt',
        'has_comments',
        'supports',
        'taxonomies',
        'slug',
        'is_public',
        'is_hierarchical',
        'menu_icon',
        'menu_position',
    ];

    protected $casts = [
        'has_taxonomies' => 'boolean',
        'has_featured_image' => 'boolean',
        'has_excerpt' => 'boolean',
        'has_comments' => 'boolean',
        'supports' => 'array',
        'taxonomies' => 'array',
        'is_public' => 'boolean',
        'is_hierarchical' => 'boolean',
    ];

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function singleTemplate(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'single_template_id');
    }

    public function archiveTemplate(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'archive_template_id');
    }

    public function getSupportsAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    public function setSupportsAttribute($value)
    {
        $this->attributes['supports'] = json_encode($value);
    }

    public function getTaxonomiesAttribute($value)
    {
        return json_decode($value, true) ?? [];
    }

    public function setTaxonomiesAttribute($value)
    {
        $this->attributes['taxonomies'] = json_encode($value);
    }
}
