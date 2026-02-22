<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SitemapSettingTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'sitemap_setting_id',
        'locale',
        'included_post_type_ids',
        'include_taxonomies',
        'custom_urls',
    ];

    protected $casts = [
        'included_post_type_ids' => 'array',
        'include_taxonomies' => 'boolean',
        'custom_urls' => 'array',
    ];

    public function setting(): BelongsTo
    {
        return $this->belongsTo(SitemapSetting::class, 'sitemap_setting_id');
    }
}
