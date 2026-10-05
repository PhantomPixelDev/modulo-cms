<?php

namespace App\Models;

use App\Support\Totp;
use Database\Factories\UserFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    // is_admin stays fillable: no request mass-assigns users (UserController
    // and ProfileUpdateRequest use explicit field lists), while the installer
    // and demo seeders set the flag server-side via create()/firstOrCreate().
    protected $fillable = [
        'name',
        'email',
        'password',
        'is_admin',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_last_step',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_last_step' => 'integer',
        ];
    }

    /**
     * Two-factor authentication is on once a code from the app was confirmed.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return $this->two_factor_secret !== null && $this->two_factor_confirmed_at !== null;
    }

    /**
     * Check an authenticator code, refusing one already used.
     */
    public function verifyTwoFactorCode(string $code): bool
    {
        return DB::transaction(function () use ($code): bool {
            // Other challenges may have consumed the code or changed the secret
            // since this request loaded its user. Serialize the check and write.
            $user = $this->newQuery()->lockForUpdate()->find($this->getKey());
            if ($user === null || $user->two_factor_secret === null) {
                return false;
            }

            $step = Totp::verify($user->two_factor_secret, $code);
            if ($step === null || ($user->two_factor_last_step !== null && $step <= $user->two_factor_last_step)) {
                return false;
            }

            $user->forceFill(['two_factor_last_step' => $step])->save();
            $this->setRawAttributes($user->getAttributes(), true);

            return true;
        });
    }

    /**
     * Use up a recovery code. Each works once.
     */
    public function useRecoveryCode(string $code): bool
    {
        $code = strtoupper(trim($code));

        return DB::transaction(function () use ($code): bool {
            $user = $this->newQuery()->lockForUpdate()->find($this->getKey());
            if ($user === null || ! $user->hasTwoFactorEnabled()) {
                return false;
            }

            $remaining = [];
            $matched = false;
            foreach ((array) $user->two_factor_recovery_codes as $candidate) {
                if (! $matched && hash_equals((string) $candidate, $code)) {
                    $matched = true;

                    continue;
                }

                $remaining[] = $candidate;
            }

            if ($matched) {
                $user->forceFill(['two_factor_recovery_codes' => $remaining])->save();
                $this->setRawAttributes($user->getAttributes(), true);
            }

            return $matched;
        });
    }

    /**
     * @return array<int, string> Eight fresh recovery codes (also stored)
     */
    public function regenerateRecoveryCodes(): array
    {
        $codes = collect(range(1, 8))
            ->map(fn () => strtoupper(bin2hex(random_bytes(4))).'-'.strtoupper(bin2hex(random_bytes(4))))
            ->all();

        $this->forceFill(['two_factor_recovery_codes' => $codes])->save();

        return $codes;
    }

    /**
     * Get the user's roles and permissions for the frontend.
     */
    public function getRolesAndPermissionsAttribute()
    {
        return [
            'roles' => $this->roles->map(function ($role) {
                return [
                    'id' => $role->id,
                    'name' => $role->name,
                ];
            }),
            'permissions' => $this->getAllPermissions()->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                ];
            }),
        ];
    }

    /**
     * Send the password reset notification.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPassword($token));
    }
}
