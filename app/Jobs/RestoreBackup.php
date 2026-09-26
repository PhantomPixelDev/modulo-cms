<?php

namespace App\Jobs;

use App\Support\SystemMeta;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Throwable;

/**
 * A restore started from the admin. It runs outside the web request (the
 * database it replaces is the one serving that request) through the same
 * guarded command as the CLI: maintenance mode, restore, migrate, back up.
 */
class RestoreBackup implements ShouldQueue
{
    use Queueable;

    /** A restore is not something to retry blindly. */
    public int $tries = 1;

    public int $timeout = 3600;

    public const STATUS_KEY = 'backups.restore';

    /**
     * @param  list<string>  $parts
     */
    public function __construct(public string $backup, public array $parts = ['database', 'media', 'plugins']) {}

    public function handle(): void
    {
        self::status('running', null, $this->backup);

        try {
            $exit = Artisan::call('modulo:restore', ['backup' => $this->backup, '--only' => $this->parts, '--force' => true]);
            $output = trim(Artisan::output());
        } catch (Throwable $e) {
            $exit = 1;
            $output = $e->getMessage();
        }

        self::status($exit === 0 ? 'done' : 'failed', $exit === 0 ? null : $output, $this->backup);
    }

    public static function status(string $state, ?string $message, string $backup): void
    {
        SystemMeta::put(self::STATUS_KEY, (string) json_encode([
            'state' => $state,
            'backup' => $backup,
            'message' => $message,
            'at' => now()->toIso8601String(),
        ]));
    }

    /**
     * @return array{state: string, backup: string, message: string|null, at: string}|null
     */
    public static function current(): ?array
    {
        $status = json_decode((string) SystemMeta::get(self::STATUS_KEY), true);

        return is_array($status) ? $status : null;
    }
}
