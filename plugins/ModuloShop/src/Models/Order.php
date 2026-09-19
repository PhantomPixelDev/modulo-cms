<?php

namespace Plugins\ModuloShop\src\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

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
        return match($this->status) {
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
        return match($this->payment_status) {
            self::PAYMENT_PENDING => 'Pending',
            self::PAYMENT_PAID => 'Paid',
            self::PAYMENT_FAILED => 'Failed',
            self::PAYMENT_REFUNDED => 'Refunded',
            default => ucfirst($this->payment_status),
        };
    }
}
