<?php

namespace Plugins\ModuloShop\src\Support;

use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Reading a product's shop data (kept in posts.meta_data): the price it sells
 * for right now, and its variations. One place, so the product page, the
 * cart, stock and checkout agree.
 *
 * Variations are rows of {id, name, sku, price, stock}. A variation without a
 * price sells at the product's (sale) price; a variation without stock is
 * not tracked, like a product without stock.
 */
final class ProductData
{
    /**
     * @param  array<string, mixed>  $meta
     */
    public static function saleActive(array $meta, ?Carbon $now = null): bool
    {
        $sale = $meta['sale_price'] ?? null;

        if ($sale === null || $sale === '' || (float) $sale >= (float) ($meta['price'] ?? 0)) {
            return false;
        }

        $now ??= now();
        $starts = self::date($meta['sale_starts_at'] ?? null);
        $ends = self::date($meta['sale_ends_at'] ?? null);
        // A date without a time ("2026-10-31") means through that whole day
        if ($ends !== null && strlen((string) $meta['sale_ends_at']) === 10) {
            $ends = $ends->endOfDay();
        }

        return ($starts === null || $starts->lte($now)) && ($ends === null || $ends->gte($now));
    }

    /**
     * What one unit costs right now, for the product or one of its variations.
     *
     * @param  array<string, mixed>  $meta
     * @param  array<string, mixed>|null  $variant
     */
    public static function unitPrice(array $meta, ?array $variant = null): float
    {
        if ($variant !== null && isset($variant['price']) && $variant['price'] !== '') {
            return round((float) $variant['price'], 2);
        }

        return round((float) (self::saleActive($meta) ? $meta['sale_price'] : ($meta['price'] ?? 0)), 2);
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return list<array{id: string, name: string, sku: string|null, price: float|null, stock: int|null}>
     */
    public static function variants(array $meta): array
    {
        $rows = [];
        foreach (is_array($meta['variants'] ?? null) ? $meta['variants'] : [] as $row) {
            if (! is_array($row) || trim((string) ($row['name'] ?? '')) === '') {
                continue;
            }

            $rows[] = [
                'id' => (string) ($row['id'] ?? Str::slug((string) $row['name'])),
                'name' => trim((string) $row['name']),
                'sku' => isset($row['sku']) && $row['sku'] !== '' ? (string) $row['sku'] : null,
                'price' => isset($row['price']) && $row['price'] !== '' ? round((float) $row['price'], 2) : null,
                'stock' => isset($row['stock']) && $row['stock'] !== '' ? (int) $row['stock'] : null,
            ];
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array{id: string, name: string, sku: string|null, price: float|null, stock: int|null}|null
     */
    public static function variant(array $meta, ?string $id): ?array
    {
        foreach (self::variants($meta) as $variant) {
            if ($variant['id'] === $id) {
                return $variant;
            }
        }

        return null;
    }

    /**
     * Normalize variation rows from the admin form: ids are slugs of the
     * names (kept stable for existing rows) and unique within the product.
     *
     * @param  array<int, array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    public static function prepareVariants(array $rows): array
    {
        $seen = [];
        $out = [];
        foreach ($rows as $row) {
            $name = trim((string) ($row['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $id = (string) ($row['id'] ?? '') ?: (Str::slug($name) ?: 'option');
            $base = $id;
            for ($i = 2; isset($seen[$id]); $i++) {
                $id = $base.'-'.$i;
            }
            $seen[$id] = true;

            $out[] = [
                'id' => $id,
                'name' => $name,
                'sku' => ($row['sku'] ?? '') !== '' ? (string) $row['sku'] : null,
                'price' => isset($row['price']) && $row['price'] !== '' ? round((float) $row['price'], 2) : null,
                'stock' => isset($row['stock']) && $row['stock'] !== '' ? max(0, (int) $row['stock']) : null,
            ];
        }

        return $out;
    }

    /** Cart and stock key for a product, or one of its variations. */
    public static function lineKey(int $productId, ?string $variantId): string
    {
        return $variantId === null || $variantId === '' ? (string) $productId : $productId.':'.$variantId;
    }

    /**
     * @return array{0: int, 1: string|null}
     */
    public static function parseLineKey(string|int $key): array
    {
        $parts = explode(':', (string) $key, 2);

        return [(int) $parts[0], $parts[1] ?? null];
    }

    private static function date(mixed $value): ?Carbon
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }
}
