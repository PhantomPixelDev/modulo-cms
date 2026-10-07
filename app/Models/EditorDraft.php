<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property int $user_id
 * @property int|null $post_id
 * @property string $content_type
 * @property string $locale
 * @property array<string, mixed> $payload
 * @property int $revision
 * @property Carbon $updated_at
 */
class EditorDraft extends Model
{
    use Prunable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['payload' => 'array', 'revision' => 'integer'];
    }

    /** @return Builder<EditorDraft> */
    public function prunable(): Builder
    {
        return static::where('updated_at', '<', now()->subDays(30));
    }
}
