<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\MassPrunable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One entry in the audit trail: who did what, to what, from where.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $event
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string $description
 * @property array<string, mixed>|null $properties
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property Carbon $created_at
 */
class Activity extends Model
{
    use MassPrunable;

    public const UPDATED_AT = null;

    protected $table = 'activity_log';

    protected $guarded = ['id'];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Entries older than the retention period (security.activity_retention_days).
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        $days = (int) config('security.activity_retention_days');

        // 0 keeps everything: match nothing.
        return $days > 0
            ? static::query()->where('created_at', '<', now()->subDays($days))
            : static::query()->whereRaw('1 = 0');
    }
}
