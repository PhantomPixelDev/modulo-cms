<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\RestoreBackup;
use App\Services\BackupManager;
use App\Support\ActivityLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

/**
 * Full-site backups from the admin: list, create, upload, download, delete
 * and restore.
 *
 * A restore replaces the database the request itself runs on, so it is
 * queued: a worker runs the same guarded `modulo:restore` as the command line
 * (maintenance mode, restore, migrate). A backup holds the whole database,
 * password hashes included, so only administrators get here at all.
 */
class BackupController extends Controller
{
    public function __construct(protected BackupManager $backups) {}

    public function index(): Response
    {
        $this->authorizeAdmin();

        return Inertia::render('Dashboard', [
            'adminSection' => 'backups',
            'backups' => [
                'items' => $this->backups->all(),
                'keep' => (int) config('backups.keep'),
                'scheduled' => (bool) config('backups.schedule'),
                'directory' => $this->backups->directory(),
                'offsite' => $this->backups->offsiteStatus(),
                'restore' => RestoreBackup::current(),
                'uploadMaxMb' => $this->uploadLimitMb(),
            ],
        ]);
    }

    public function store(): RedirectResponse
    {
        $this->authorizeAdmin();

        // Media can make this take a while.
        @set_time_limit(0);

        try {
            $path = $this->backups->create();
            $this->backups->prune((int) config('backups.keep'));
            ActivityLog::record('backup.created', 'Created backup '.basename($path));
        } catch (Throwable $e) {
            return back()->with('error', __('dashboard.backups.messages.failed', ['reason' => $e->getMessage()]));
        }

        try {
            $this->backups->copyOffsite($path);
        } catch (Throwable $e) {
            return back()->with('warning', __('dashboard.backups.messages.offsite_failed', ['name' => basename($path), 'reason' => $e->getMessage()]));
        }

        return back()->with('success', __('dashboard.backups.messages.created', ['name' => basename($path)]));
    }

    public function download(string $backup): BinaryFileResponse
    {
        $this->authorizeAdmin();

        $path = $this->backups->path($backup);
        abort_if($path === null, 404);
        ActivityLog::record('backup.downloaded', 'Downloaded backup '.$backup);

        return response()->download($path, $backup, ['Content-Type' => 'application/zip']);
    }

    public function destroy(string $backup): RedirectResponse
    {
        $this->authorizeAdmin();

        abort_unless($this->backups->delete($backup), 404);
        ActivityLog::record('backup.deleted', 'Deleted backup '.$backup);

        return back()->with('success', __('dashboard.backups.messages.deleted'));
    }

    /**
     * Bring in a backup made elsewhere, e.g. to move a site to this server.
     */
    public function upload(Request $request): RedirectResponse
    {
        $this->authorizeAdmin();
        $request->validate(['backup' => ['required', 'file', 'mimes:zip', 'max:'.($this->uploadLimitMb() * 1024)]]);

        File::ensureDirectoryExists($this->backups->directory(), 0750);
        $moment = now();
        do {
            $name = 'modulo-backup-'.$moment->format('Y-m-d_His').'.zip';
            $moment = $moment->addSecond();
        } while (File::exists($this->backups->directory().'/'.$name));

        $request->file('backup')->move($this->backups->directory(), $name);
        $path = $this->backups->directory().'/'.$name;

        if ($this->backups->manifest($path) === null) {
            File::delete($path);

            return back()->withErrors(['backup' => __('dashboard.backups.messages.not_a_backup')]);
        }

        ActivityLog::record('backup.uploaded', 'Uploaded backup '.$name);

        return back()->with('success', __('dashboard.backups.messages.uploaded', ['name' => $name]));
    }

    /**
     * Queue a restore. The name has to be typed again: it replaces everything.
     */
    public function restore(Request $request, string $backup): RedirectResponse
    {
        $this->authorizeAdmin();
        abort_if($this->backups->path($backup) === null, 404);

        $data = $request->validate([
            'confirm' => ['required', 'string', Rule::in([$backup])],
            'parts' => ['required', 'array', 'min:1'],
            'parts.*' => [Rule::in(['database', 'media', 'plugins'])],
        ], ['confirm.in' => __('dashboard.backups.messages.confirm_mismatch')]);

        if (in_array(RestoreBackup::current()['state'] ?? null, ['queued', 'running'], true)) {
            return back()->with('error', __('dashboard.backups.messages.restore_busy'));
        }

        RestoreBackup::status('queued', null, $backup);
        ActivityLog::record('backup.restore_started', 'Started restoring '.$backup, null, ['parts' => $data['parts']]);
        RestoreBackup::dispatch($backup, array_values($data['parts']));

        return back()->with('success', __('dashboard.backups.messages.restore_queued'));
    }

    /**
     * The largest upload PHP accepts here, in MB.
     */
    protected function uploadLimitMb(): int
    {
        $bytes = fn (string $value) => (int) $value * match (strtolower(substr(trim($value), -1))) {
            'g' => 1073741824, 'm' => 1048576, 'k' => 1024, default => 1,
        };
        $limits = array_filter([$bytes((string) ini_get('upload_max_filesize')), $bytes((string) ini_get('post_max_size'))]);

        return max(1, intdiv($limits === [] ? 104857600 : min($limits), 1048576));
    }

    protected function authorizeAdmin(): void
    {
        abort_unless(auth()->user()?->hasRole(['admin', 'super-admin']) ?? false, 403);
    }
}
