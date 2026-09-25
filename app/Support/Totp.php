<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Time-based one-time passwords (RFC 6238) as used by authenticator apps:
 * HMAC-SHA1, 6 digits, 30-second steps, base32 secrets.
 */
class Totp
{
    public const PERIOD = 30;

    public const DIGITS = 6;

    protected const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /** A new random secret, base32 (160 bits, as RFC 4226 recommends). */
    public static function generateSecret(): string
    {
        return self::base32Encode(random_bytes(20));
    }

    /** The code for a secret at a time step. */
    public static function at(string $secret, int $step): string
    {
        $hash = hash_hmac('sha1', pack('N*', 0, $step), self::base32Decode($secret), true);
        $offset = ord($hash[19]) & 0x0F;
        $value = ((ord($hash[$offset]) & 0x7F) << 24)
            | (ord($hash[$offset + 1]) << 16)
            | (ord($hash[$offset + 2]) << 8)
            | ord($hash[$offset + 3]);

        return str_pad((string) ($value % (10 ** self::DIGITS)), self::DIGITS, '0', STR_PAD_LEFT);
    }

    public static function currentStep(?int $timestamp = null): int
    {
        return intdiv($timestamp ?? time(), self::PERIOD);
    }

    /**
     * The time step a code belongs to, allowing one step of clock drift either
     * way, or null when it matches none.
     *
     * The caller must refuse a step at or before the last one it accepted for
     * the same user, or a code could be replayed within its 90-second window.
     */
    public static function verify(string $secret, string $code, ?int $timestamp = null, int $window = 1): ?int
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';

        if (preg_match('/^\d{'.self::DIGITS.'}$/', $code) !== 1) {
            return null;
        }

        $now = self::currentStep($timestamp);

        for ($step = $now - $window; $step <= $now + $window; $step++) {
            if (hash_equals(self::at($secret, $step), $code)) {
                return $step;
            }
        }

        return null;
    }

    /** The otpauth:// URI an authenticator app reads from a QR code. */
    public static function uri(string $secret, string $account, string $issuer): string
    {
        return sprintf(
            'otpauth://totp/%s:%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d',
            rawurlencode($issuer),
            rawurlencode($account),
            $secret,
            rawurlencode($issuer),
            self::DIGITS,
            self::PERIOD,
        );
    }

    public static function base32Encode(string $bytes): string
    {
        $bits = '';
        foreach (str_split($bytes) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $out = '';
        foreach (str_split($bits, 5) as $chunk) {
            $out .= self::ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

        return $out;
    }

    public static function base32Decode(string $encoded): string
    {
        $encoded = strtoupper(rtrim(preg_replace('/\s+/', '', $encoded) ?? '', '='));
        $bits = '';

        foreach (str_split($encoded) as $char) {
            $index = strpos(self::ALPHABET, $char);
            if ($index === false) {
                throw new InvalidArgumentException('Invalid base32 secret.');
            }
            $bits .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
        }

        $out = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $out .= chr((int) bindec($byte));
            }
        }

        return $out;
    }
}
