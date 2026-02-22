<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemTranslation extends Model
{
    use HasFactory;

    protected $fillable = [
        'menu_item_id',
        'locale',
        'label',
        'url',
    ];

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function scopeForLocale($query, string $locale)
    {
        return $query->where('locale', $locale);
    }
}
