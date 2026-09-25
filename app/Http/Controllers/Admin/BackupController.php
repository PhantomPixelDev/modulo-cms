<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BackupManager;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

/**
 * Full-site backups from the admin: list, create, download and delete.
 *
 * Restoring replaces the database under everyone's feet, so it stays a
 * command-line job (`php artisan modulo:restore`); the page shows the command.
 * A backup holds the whole database, password hashes included, so only
 * administrators get here at all.
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
        } catch (Throwable $e) {
            return back()->with('error', 'Backup failed: '.$e->getMessage());
        }

        return back()->with('success', 'Backup created: '.basename($path));
    }

    public function download(string $backup): BinaryFileResponse
    {
        $this->authorizeAdmin();

        $path = $this->backups->path($backup);
        abort_if($path === null, 404);

        return response()->download($path, $backup, ['Content-Type' => 'application/zip']);
    }

    public function destroy(string $backup): RedirectResponse
    {
        $this->authorizeAdmin();

        abort_unless($this->backups->delete($backup), 404);

        return back()->with('success', 'Backup deleted.');
    }

    protected function authorizeAdmin(): void
    {
        abort_unless(auth()->user()?->hasRole(['admin', 'super-admin']) ?? false, 403);
    }
}
