<?php

namespace Plugins\ModuloShop\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property string $gateway
 * @property string|null $provider_ref
 * @property string $status
 * @property float $amount
 * @property string $currency
 * @property array<string, mixed>|null $data
 * @property Carbon|null $created_at
 * @property Order $order
 */
class Payment extends Model
{
    public const PENDING = 'pending';

    public const PAID = 'paid';

    public const FAILED = 'failed';

    public const CANCELLED = 'cancelled';

    public const REFUNDED = 'refunded';

    protected $table = 'shop_payments';

    protected $fillable = ['order_id', 'gateway', 'provider_ref', 'status', 'amount', 'currency', 'data'];

    protected $casts = [
        'amount' => 'float',
        'data' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
