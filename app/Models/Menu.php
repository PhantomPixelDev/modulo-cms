<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'location', 'description'
    ];

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)
            ->whereNull('parent_id')
            ->orderBy('order')
            ->with(['translations', 'children']);
    }

    public function allItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }
}
