<?php

namespace Plugins\ModuloShop\src\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int|null $user_id
 * @property string $type
 * @property string $message
 * @property bool $customer_notified
 * @property Carbon|null $created_at
 * @property-read User|null $user
 */
class OrderNote extends Model
{
    public const NOTE = 'note';

    public const STATUS = 'status';

    public const PAYMENT = 'payment';

    public const SYSTEM = 'system';

    protected $table = 'shop_order_notes';

    protected $fillable = ['order_id', 'user_id', 'type', 'message', 'customer_notified'];

    protected $casts = [
        'customer_notified' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
