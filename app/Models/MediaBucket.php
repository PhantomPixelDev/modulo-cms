<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaBucket extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = ['name', 'parent_id'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    protected static function booted(): void
    {
        static::saving(function (self $bucket) {
            // Ensure slug and path are set based on name and parent
            if (!$bucket->slug) {
                $bucket->slug = Str::slug((string) $bucket->name);
            }
            $parentPath = '';
            if ($bucket->parent_id) {
                $parent = $bucket->parent()->first();
                $parentPath = $parent?->path ? rtrim($parent->path, '/') : '';
            }
            $bucket->path = ltrim(trim($parentPath . '/' . $bucket->slug, '/'), '/');
        });
    }

    // Media conversions disabled for now to avoid processing issues during uploads
}
