<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
}
