<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * A redirect from an old URL on this site.
 *
 * @property int $id
 * @property string $from_path
 * @property string $to_url
 * @property int $status_code
 * @property int $hits
 * @property Carbon|null $last_hit_at
 * @property bool $automatic
 */
class Redirect extends Model
{
    public const CACHE_KEY = 'modulo:redirects';

    public const STATUS_CODES = [301, 302, 307, 308];

    protected $fillable = ['from_path', 'to_url', 'status_code', 'automatic'];

    protected $casts = [
        'status_code' => 'integer',
        'hits' => 'integer',
        'last_hit_at' => 'datetime',
        'automatic' => 'boolean',
    ];

    protected static function booted(): void
    {
        $forget = fn () => Cache::forget(self::CACHE_KEY);
        static::saved($forget);
        static::deleted($forget);
    }

    /** "/Old-Page/?x=1" and "old-page" both become "/Old-Page". */
    public static function normalizePath(string $path): string
    {
        $path = (string) parse_url(trim($path), PHP_URL_PATH);

        return '/'.trim(rawurldecode($path), '/');
    }

    /**
     * Every redirect, keyed by path, cached until one changes: the lookup
     * runs on every front-end request.
     *
     * @return array<string, array{0: string, 1: int, 2: int}> path => [to, status, id]
     */
    public static function map(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => static::query()
            ->get(['id', 'from_path', 'to_url', 'status_code'])
            ->mapWithKeys(fn (Redirect $r) => [$r->from_path => [$r->to_url, $r->status_code, $r->id]])
            ->all());
    }

    /**
     * Point an old URL at a new one, keeping chains short: anything that
     * pointed at the old URL now points at the new one, and a redirect away
     * from the new URL (a rename being undone) is dropped.
     */
    public static function point(string $from, string $to, bool $automatic = false): ?self
    {
        $from = self::normalizePath($from);
        $to = str_starts_with($to, 'http') ? $to : self::normalizePath($to);

        if ($from === $to || $from === '/') {
            return null;
        }

        static::where('from_path', $to)->delete();
        static::where('to_url', $from)->update(['to_url' => $to]);
        Cache::forget(self::CACHE_KEY);

        return static::updateOrCreate(['from_path' => $from], ['to_url' => $to, 'status_code' => 301, 'automatic' => $automatic]);
    }
}
