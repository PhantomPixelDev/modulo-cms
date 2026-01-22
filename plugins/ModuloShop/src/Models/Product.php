<?php

namespace Plugins\ModuloShop\src\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'shop_products';

    protected $fillable = [
        'sku',
        'name',
        'slug',
        'description',
        'price',
        'currency',
        'is_active',
        'stock',
        'meta',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'stock' => 'integer',
        'meta' => 'array',
    ];
}
