<?php

namespace Plugins\ModuloShop\src\Payments;

/**
 * Amounts as payment providers want them.
 */
final class Money
{
    /** Currencies without minor units (ISO 4217 exponent 0). */
    private const ZERO_DECIMAL = ['BIF', 'CLP', 'DJF', 'GNF', 'ISK', 'JPY', 'KMF', 'KRW', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];

    public static function decimals(string $currency): int
    {
        return in_array(strtoupper($currency), self::ZERO_DECIMAL, true) ? 0 : 2;
    }

    /** "70.35" / "70": the string format PayPal and Mollie expect. */
    public static function string(float $amount, string $currency): string
    {
        return number_format($amount, self::decimals($currency), '.', '');
    }

    /** 7035: the integer minor units Stripe expects. */
    public static function minor(float $amount, string $currency): int
    {
        return (int) round($amount * (10 ** self::decimals($currency)));
    }

    public static function fromMinor(int $minor, string $currency): float
    {
        return $minor / (10 ** self::decimals($currency));
    }

    /** Paid amounts are compared to the cent, not with float equality. */
    public static function covers(float $paid, float $due, string $currency): bool
    {
        return self::minor($paid, $currency) >= self::minor($due, $currency);
    }
}
