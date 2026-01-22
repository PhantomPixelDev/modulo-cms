<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Plugin extends Model
{
    /** @use HasFactory<\Database\Factories\PluginFactory> */
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
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
        'installed_at' => 'datetime',
    ];

    /**
     * Scope a query to only include active plugins.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
