<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Comment;
use App\Models\PostTranslation;
use App\Models\Locale;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_type_id',
        'author_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'featured_image',
        'status',
        'published_at',
        'parent_id',
        'menu_order',
        'meta_title',
        'meta_description',
        'meta_data',
        'view_count',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'meta_data' => 'array',
    ];

    public function postType(): BelongsTo
    {
        return $this->belongsTo(PostType::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Post::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Post::class, 'parent_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)
            ->whereNull('parent_id')
            ->where('status', 'approved')
            ->orderBy('created_at');
    }

    public function allComments(): HasMany
    {
        return $this->hasMany(Comment::class)
            ->where('status', 'approved')
            ->orderBy('created_at');
    }

    public function taxonomyTerms(): BelongsToMany
    {
        return $this->belongsToMany(TaxonomyTerm::class, 'post_taxonomy_terms')
                    ->withTimestamps();
    }

    // Scopes for filtering
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->where('published_at', '<=', now());
    }

    public function scopeByPostType($query, $postTypeId)
    {
        return $query->where('post_type_id', $postTypeId);
    }

    public function scopeByAuthor($query, $authorId)
    {
        return $query->where('author_id', $authorId);
    }

    /**
     * Get all translations for this post
     */
    public function translations(): HasMany
    {
        return $this->hasMany(PostTranslation::class);
    }

    /**
     * Get translation for a specific locale
     */
    public function translation(string $locale): ?PostTranslation
    {
        return $this->translations()->where('locale', $locale)->first();
    }

    /**
     * Get translation for locale or fallback to default
     */
    public function translationOrFallback(?string $locale = null): ?PostTranslation
    {
        $locale = $locale ?? app()->getLocale();
        
        $translation = $this->translation($locale);
        
        if (!$translation) {
            $defaultLocale = Locale::getDefault()?->code ?? 'en';
            $translation = $this->translation($defaultLocale);
        }
        
        return $translation;
    }

    /**
     * Get available locale codes for this post
     */
    public function availableLocales(): array
    {
        return $this->translations()->pluck('locale')->toArray();
    }

    /**
     * Check if post has translation for locale
     */
    public function hasTranslation(string $locale): bool
    {
        return $this->translations()->where('locale', $locale)->exists();
    }

    /**
     * Create or update a translation
     */
    public function setTranslation(string $locale, array $data): PostTranslation
    {
        return $this->translations()->updateOrCreate(
            ['locale' => $locale],
            $data
        );
    }
}
