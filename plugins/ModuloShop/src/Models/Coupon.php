<?php

namespace Plugins\ModuloShop\src\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $code
 * @property string|null $description
 * @property string $type
 * @property float $amount
 * @property float|null $min_subtotal
 * @property Carbon|null $starts_at
 * @property Carbon|null $expires_at
 * @property int|null $usage_limit
 * @property int $used_count
 * @property bool $is_active
 */
class Coupon extends Model
{
    public const TYPE_PERCENT = 'percent';

    public const TYPE_FIXED = 'fixed';

    public const TYPE_FREE_SHIPPING = 'free_shipping';

    public const TYPES = [self::TYPE_PERCENT, self::TYPE_FIXED, self::TYPE_FREE_SHIPPING];

    protected $table = 'shop_coupons';

    protected $fillable = [
        'code',
        'description',
        'type',
        'amount',
        'min_subtotal',
        'starts_at',
        'expires_at',
        'usage_limit',
        'used_count',
        'is_active',
    ];

    /** Mirror the column defaults, so a coupon just created behaves like one loaded. */
    protected $attributes = [
        'is_active' => true,
        'used_count' => 0,
        'amount' => 0,
    ];

    protected $casts = [
        'amount' => 'float',
        'min_subtotal' => 'float',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'is_active' => 'boolean',
    ];

    public static function normalizeCode(string $code): string
    {
        return strtoupper(trim($code));
    }

    public static function findByCode(?string $code): ?self
    {
        if ($code === null || trim($code) === '') {
            return null;
        }

        return static::query()->where('code', static::normalizeCode($code))->first();
    }

    protected function setCodeAttribute(string $value): void
    {
        $this->attributes['code'] = static::normalizeCode($value);
    }

    /**
     * Why this coupon cannot be used on a cart of this value, or null if it can.
     */
    public function unusableReason(float $subtotal): ?string
    {
        if (! $this->is_active) {
            return 'This coupon is not active.';
        }

        if ($this->starts_at !== null && $this->starts_at->isFuture()) {
            return 'This coupon is not valid yet.';
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return 'This coupon has expired.';
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            return 'This coupon has been used up.';
        }

        if ($this->min_subtotal !== null && $subtotal < $this->min_subtotal) {
            return sprintf('This coupon needs an order of at least %s.', number_format($this->min_subtotal, 2));
        }

        return null;
    }
}
