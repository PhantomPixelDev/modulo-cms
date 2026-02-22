<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class TranslationOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'locale',
        'domain',
        'key',
        'value',
    ];

    public function scopeForLocale(Builder $query, string $locale): Builder
    {
        return $query->where('locale', $locale);
    }

    public function scopeForDomain(Builder $query, string $domain): Builder
    {
        return $query->where('domain', $domain);
    }
}
