<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class Locale extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'native_name',
        'direction',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Cache key for active locales
     */
    protected const CACHE_KEY = 'locales:active';
    protected const CACHE_TTL = 3600; // 1 hour

    /**
     * Get all active locales (cached)
     */
    public static function getActive(): \Illuminate\Database\Eloquent\Collection
    {
        if (!self::localesTableAvailable()) {
            return new \Illuminate\Database\Eloquent\Collection();
        }

        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return static::where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Get the default locale
     */
    public static function getDefault(): ?self
    {
        return static::getActive()->firstWhere('is_default', true)
            ?? static::getActive()->first();
    }

    /**
     * Get locale by code
     */
    public static function findByCode(string $code): ?self
    {
        return static::getActive()->firstWhere('code', $code);
    }

    /**
     * Check if a locale code is valid and active
     */
    public static function isValidCode(string $code): bool
    {
        return static::getActive()->contains('code', $code);
    }

    /**
     * Clear the locales cache
     */
    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    protected static function localesTableAvailable(): bool
    {
        try {
            return Schema::hasTable((new static())->getTable());
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Boot the model
     */
    protected static function booted(): void
    {
        // Clear cache when locales are modified
        static::saved(fn () => static::clearCache());
        static::deleted(fn () => static::clearCache());
    }

    /**
     * Set this locale as default (and unset others)
     */
    public function setAsDefault(): bool
    {
        return \DB::transaction(function () {
            // Unset current default
            static::where('is_default', true)->update(['is_default' => false]);
            
            // Set this as default
            $this->is_default = true;
            return $this->save();
        });
    }

    /**
     * Get the display name (native name if available, otherwise name)
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->native_name ?: $this->name;
    }
}
