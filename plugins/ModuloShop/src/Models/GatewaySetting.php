<?php

namespace Plugins\ModuloShop\src\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $gateway
 * @property bool $enabled
 * @property array<string, mixed>|null $config
 */
class GatewaySetting extends Model
{
    protected $table = 'shop_gateway_settings';

    protected $fillable = ['gateway', 'enabled', 'config'];

    protected $casts = [
        'enabled' => 'boolean',
        // API keys live here: encrypted at rest with the app key
        'config' => 'encrypted:array',
    ];

    protected $hidden = ['config'];
}
