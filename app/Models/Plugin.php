<?php

namespace App\Models;

use Database\Factories\PluginFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plugin extends Model
{
    /** @use HasFactory<PluginFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'version',
        'description',
        'author',
        'service_provider',
        'is_active',
        'settings',
        'installed_at',
        'source',
        'source_url',
        'checksum',
        'available_version',
        'last_checked_at',
        'min_core_version',
        'requires',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
        'installed_at' => 'datetime',
        'last_checked_at' => 'datetime',
        'requires' => 'array',
    ];

    /**
     * Scope a query to only include active plugins.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
