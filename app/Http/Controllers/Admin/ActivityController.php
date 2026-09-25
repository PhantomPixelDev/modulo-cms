<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The audit trail. Administrators only: it shows who signed in from where
 * and every change to users, roles, settings and extensions.
 */
class ActivityController extends Controller
{
    /** Event groups offered as filters (the prefix before the dot). */
    public const GROUPS = ['auth', '2fa', 'user', 'role', 'post', 'page', 'settings', 'redirect', 'plugin', 'theme', 'backup', 'core'];

    public function index(Request $request): Response
    {
        abort_unless($request->user()?->hasRole(['admin', 'super-admin']) ?? false, 403);

        $filters = $request->validate([
            'group' => ['nullable', 'string', 'in:'.implode(',', self::GROUPS)],
            'user' => ['nullable', 'integer'],
            'q' => ['nullable', 'string', 'max:100'],
        ]);

        $entries = Activity::query()
            ->with('user:id,name,email')
            ->when($filters['group'] ?? null, fn ($q, $group) => $q->where('event', 'like', $group.'.%'))
            ->when($filters['user'] ?? null, fn ($q, $user) => $q->where('user_id', $user))
            ->when($filters['q'] ?? null, fn ($q, $term) => $q->where('description', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%'))
            ->orderByDesc('id')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (Activity $entry) => [
                'id' => $entry->id,
                'event' => $entry->event,
                'description' => $entry->description,
                'properties' => $entry->properties,
                'user' => $entry->user ? ['id' => $entry->user->id, 'name' => $entry->user->name, 'email' => $entry->user->email] : null,
                'ip_address' => $entry->ip_address,
                'user_agent' => $entry->user_agent,
                'created_at' => $entry->created_at->toIso8601String(),
            ]);

        return Inertia::render('Dashboard', [
            'adminSection' => 'activity',
            'activity' => [
                'entries' => $entries,
                'filters' => $filters + ['group' => null, 'user' => null, 'q' => null],
                'groups' => self::GROUPS,
                'retentionDays' => (int) config('security.activity_retention_days'),
            ],
        ]);
    }
}
