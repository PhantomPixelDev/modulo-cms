<?php

namespace Plugins\ModuloShop\src\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $order_number
 * @property int|null $user_id
 * @property string $status
 * @property string $subtotal
 * @property string $discount
 * @property string $shipping
 * @property string $tax
 * @property string $total
 * @property string $currency
 * @property string $customer_email
 * @property string $customer_name
 * @property string|null $customer_phone
 * @property string $billing_address_1
 * @property string|null $billing_address_2
 * @property string $billing_city
 * @property string|null $billing_state
 * @property string $billing_postcode
 * @property string $billing_country
 * @property bool $ship_to_different
 * @property string|null $shipping_address_1
 * @property string|null $shipping_address_2
 * @property string|null $shipping_city
 * @property string|null $shipping_state
 * @property string|null $shipping_postcode
 * @property string|null $shipping_country
 * @property string|null $payment_method
 * @property string $payment_status
 * @property string|null $transaction_id
 * @property Carbon|null $paid_at
 * @property string|null $shipping_method Name of the method chosen at checkout
 * @property string|null $tracking_number
 * @property Carbon|null $shipped_at
 * @property string|null $customer_note
 * @property string|null $admin_note
 * @property string|null $coupon_code
 * @property array<string, mixed>|null $meta_data
 * @property string|null $access_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, OrderItem> $items
 * @property-read Collection<int, OrderNote> $notes
 */
class Order extends Model
{
    protected $table = 'shop_orders';

    protected $fillable = [
        'order_number',
        'user_id',
        'status',
        'subtotal',
        'discount',
        'shipping',
        'tax',
        'total',
        'currency',
        'customer_email',
        'customer_name',
        'customer_phone',
        'billing_address_1',
        'billing_address_2',
        'billing_city',
        'billing_state',
        'billing_postcode',
        'billing_country',
        'ship_to_different',
        'shipping_address_1',
        'shipping_address_2',
        'shipping_city',
        'shipping_state',
        'shipping_postcode',
        'shipping_country',
        'payment_method',
        'payment_status',
        'transaction_id',
        'paid_at',
        'shipping_method',
        'tracking_number',
        'shipped_at',
        'customer_note',
        'admin_note',
        'coupon_code',
        'meta_data',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'shipping' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'ship_to_different' => 'boolean',
        'paid_at' => 'datetime',
        'shipped_at' => 'datetime',
        'meta_data' => 'array',
    ];

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_SHIPPED = 'shipped';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REFUNDED = 'refunded';

    public const PAYMENT_PENDING = 'pending';

    public const PAYMENT_PAID = 'paid';

    public const PAYMENT_FAILED = 'failed';

    public const PAYMENT_REFUNDED = 'refunded';

    protected $hidden = ['access_token'];

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $order->access_token ??= Str::random(40);
        });
    }

    public static function generateOrderNumber(): string
    {
        $prefix = 'ORD';
        $timestamp = now()->format('Ymd');
        // Random (not time-derived) so numbers can't be guessed or collide
        $random = Str::upper(Str::random(8));

        return "{$prefix}-{$timestamp}-{$random}";
    }

    /**
     * Secret link that lets the (possibly guest) customer view the order.
     */
    public function confirmationUrl(): string
    {
        return route('shop.order.confirmation', [
            'orderNumber' => $this->order_number,
            'key' => $this->access_token,
        ]);
    }

    public function canBeViewedWith(?User $user, ?string $key): bool
    {
        if ($user && $this->user_id && $user->id === $this->user_id) {
            return true;
        }

        return is_string($key) && is_string($this->access_token) && hash_equals($this->access_token, $key);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(OrderNote::class, 'order_id')->oldest('id');
    }

    /**
     * Add a line to the order's history. Staff notes carry who wrote them;
     * changes made by the system (payments, expiry) don't.
     */
    public function addNote(string $message, string $type = OrderNote::SYSTEM, ?int $userId = null, bool $customerNotified = false): OrderNote
    {
        return OrderNote::create([
            'order_id' => $this->id,
            'message' => $message,
            'type' => $type,
            'user_id' => $userId,
            'customer_notified' => $customerNotified,
        ]);
    }

    /**
     * Quantities per product, as stock sees them.
     *
     * @return array<int, int>
     */
    public function quantities(): array
    {
        return $this->items()->whereNotNull('product_id')->get()
            ->groupBy('product_id')
            ->map(fn ($items) => (int) $items->sum('quantity'))
            ->all();
    }

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    public function getShippingAddress(): array
    {
        if ($this->ship_to_different) {
            return [
                'address_1' => $this->shipping_address_1,
                'address_2' => $this->shipping_address_2,
                'city' => $this->shipping_city,
                'state' => $this->shipping_state,
                'postcode' => $this->shipping_postcode,
                'country' => $this->shipping_country,
            ];
        }

        return [
            'address_1' => $this->billing_address_1,
            'address_2' => $this->billing_address_2,
            'city' => $this->billing_city,
            'state' => $this->billing_state,
            'postcode' => $this->billing_postcode,
            'country' => $this->billing_country,
        ];
    }

    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_SHIPPED => 'Shipped',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            self::STATUS_REFUNDED => 'Refunded',
            default => ucfirst($this->status),
        };
    }

    public function getPaymentStatusLabel(): string
    {
        return match ($this->payment_status) {
            self::PAYMENT_PENDING => 'Pending',
            self::PAYMENT_PAID => 'Paid',
            self::PAYMENT_FAILED => 'Failed',
            self::PAYMENT_REFUNDED => 'Refunded',
            default => ucfirst($this->payment_status),
        };
    }
}
