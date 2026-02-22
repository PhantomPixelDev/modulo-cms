<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'locale',
        'title',
        'slug',
        'excerpt',
        'content',
        'seo_title',
        'seo_description',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    /**
     * Get the parent post
     */
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Get the locale model
     */
    public function localeModel(): BelongsTo
    {
        return $this->belongsTo(Locale::class, 'locale', 'code');
    }

    /**
     * Scope to filter by locale
     */
    public function scopeForLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }

    /**
     * Generate a unique slug for this locale
     */
    public static function generateUniqueSlug(string $baseSlug, string $locale, ?int $excludeId = null): string
    {
        $slug = $baseSlug;
        $counter = 1;

        while (true) {
            $query = static::where('locale', $locale)->where('slug', $slug);
            
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            if (!$query->exists()) {
                break;
            }

            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
