<?php

namespace App\Support;

use App\Models\EditorDraft;
use App\Models\Locale;
use App\Models\Post;
use App\Services\SiteSettingsService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EditorSave
{
    /**
     * @template T
     *
     * @param  callable(): T  $save
     * @return T
     */
    public static function transaction(Request $request, callable $save): mixed
    {
        return DB::transaction(function () use ($request, $save) {
            if ($request->filled('editor_draft_id')) {
                $draft = EditorDraft::where('user_id', $request->user()?->id)->lockForUpdate()->findOrFail($request->input('editor_draft_id'));
                if ($draft->revision !== $request->integer('editor_draft_revision')) {
                    throw ValidationException::withMessages(['editor_draft_id' => __('This draft changed in another tab. Recover the latest draft before saving.')]);
                }
            }

            return $save();
        });
    }

    public static function prepare(Request $request, ?Post $post = null): void
    {
        if (! $request->has('editor_action')) {
            return;
        }
        $request->validate([
            'editor_action' => ['required', Rule::in(['draft', 'publish', 'schedule', 'update'])],
            'editor_draft_id' => ['nullable', 'uuid'],
            'editor_draft_revision' => ['required_with:editor_draft_id', 'integer', 'min:1'],
        ]);
        if ($request->filled('editor_draft_id')) {
            $draft = EditorDraft::where('user_id', $request->user()?->id)->findOrFail($request->input('editor_draft_id'));
            abort_unless($draft->post_id === $post?->id && $draft->locale === $request->input('locale', Locale::defaultCode()), 422);
            if ($draft->revision !== $request->integer('editor_draft_revision')) {
                throw ValidationException::withMessages(['editor_draft_id' => __('This draft changed in another tab. Recover the latest draft before saving.')]);
            }
        }
        $action = $request->string('editor_action')->toString();
        $status = match ($action) {
            'draft' => 'draft', 'publish', 'schedule' => 'published',
            default => $post === null ? 'draft' : $post->status,
        };
        $date = match ($action) {
            'draft' => null, 'publish' => now(), 'update' => $post?->published_at,
            default => self::scheduledDate($request),
        };
        $request->merge(['status' => $status, 'published_at' => $date?->toIso8601String()]);
    }

    private static function scheduledDate(Request $request): Carbon
    {
        $request->validate(['published_at' => ['required', 'date']]);
        $zone = (string) app(SiteSettingsService::class)->get('timezone', config('app.timezone'));
        // Eloquent stores datetimes without an offset and reads them in app.timezone.
        // Keep the stored wall time in that same zone to preserve the scheduled instant.
        $date = Carbon::parse($request->string('published_at')->toString(), $zone)->setTimezone(config('app.timezone'));
        if (! $date->isFuture()) {
            throw ValidationException::withMessages(['published_at' => __('Choose a future date in the site timezone.')]);
        }

        return $date;
    }

    public static function clearRecovery(Request $request): void
    {
        if ($request->filled('editor_draft_id')) {
            EditorDraft::whereKey($request->input('editor_draft_id'))->where('user_id', $request->user()?->id)
                ->where('revision', $request->integer('editor_draft_revision'))->delete();
        }
    }
}
