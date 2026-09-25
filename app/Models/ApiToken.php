<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * A personal API token. Only its SHA-256 is stored; the token is shown once,
 * when created. It acts as its user, limited to its abilities.
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $token_hash
 * @property string $prefix
 * @property array<int, string> $abilities
 * @property Carbon|null $last_used_at
 * @property Carbon|null $expires_at
 */
class ApiToken extends Model
{
    /** read: published and (with permission) unpublished content. write: create, change, delete. */
    public const ABILITIES = ['read', 'write'];

    protected $fillable = ['name', 'token_hash', 'prefix', 'abilities', 'expires_at'];

    protected $hidden = ['token_hash'];

    protected $casts = [
        'abilities' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @param  array<int, string>  $abilities
     * @return array{0: self, 1: string} The token and its plain-text value (show it once)
     */
    public static function issue(User $user, string $name, array $abilities, ?Carbon $expiresAt = null): array
    {
        $plain = 'mod_'.Str::random(40);

        $token = new self([
            'name' => $name,
            'token_hash' => hash('sha256', $plain),
            'prefix' => substr($plain, 0, 10),
            'abilities' => array_values(array_intersect(self::ABILITIES, $abilities)),
            'expires_at' => $expiresAt,
        ]);
        $token->user()->associate($user);
        $token->save();

        return [$token, $plain];
    }

    public static function findByPlainText(string $plain): ?self
    {
        if (! str_starts_with($plain, 'mod_')) {
            return null;
        }

        $token = static::with('user')->where('token_hash', hash('sha256', $plain))->first();

        return $token !== null && ! $token->isExpired() ? $token : null;
    }

    public function can(string $ability): bool
    {
        return in_array($ability, $this->abilities, true);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
