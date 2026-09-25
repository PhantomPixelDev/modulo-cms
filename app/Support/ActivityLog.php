<?php

namespace App\Support;

use App\Models\Activity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Throwable;

/**
 * Records audit entries. Never throws: an audit write failing (a missing
 * table mid-install, a full disk) must not fail the action being audited.
 */
class ActivityLog
{
    /** Property keys never written to the log, whatever a caller passes. */
    protected const REDACTED = ['password', 'password_confirmation', 'current_password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'token'];

    /**
     * @param  array<string, mixed>  $properties
     */
    public static function record(string $event, string $description, ?Model $subject = null, array $properties = [], ?int $userId = null): void
    {
        if (! schema_has_table('activity_log')) {
            return;
        }

        try {
            // Console commands have no visitor; tests run "in the console" but
            // exercise real requests.
            $console = app()->runningInConsole() && ! app()->runningUnitTests();
            $request = $console ? null : request();

            Activity::create([
                'user_id' => $userId ?? Auth::id(),
                'event' => Str::limit($event, 64, ''),
                'subject_type' => $subject !== null ? $subject->getMorphClass() : null,
                'subject_id' => $subject?->getKey(),
                'description' => Str::limit($description, 250),
                'properties' => self::clean($properties) ?: null,
                'ip_address' => $request?->ip(),
                'user_agent' => $request !== null ? Str::limit((string) $request->userAgent(), 250, '') : 'console',
                'created_at' => now(),
            ]);
        } catch (Throwable $e) {
            report($e);
        }
    }

    /**
     * @param  array<string, mixed>  $properties
     * @return array<string, mixed>
     */
    protected static function clean(array $properties): array
    {
        foreach ($properties as $key => $value) {
            if (in_array($key, self::REDACTED, true)) {
                unset($properties[$key]);
            } elseif (is_array($value)) {
                $properties[$key] = self::clean($value);
            }
        }

        return $properties;
    }
}
