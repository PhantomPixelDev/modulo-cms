<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Validation\ValidationException;
use RuntimeException;

/** A one-time operator credential, with a serialized, session-owned wizard. */
class InstallOwnership
{
    public function __construct(private InstallService $installer) {}

    public function path(): string
    {
        return $this->installer->progressPath().'.credential';
    }

    /**
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function synchronized(callable $callback): mixed
    {
        File::ensureDirectoryExists(dirname($this->path()));
        $handle = fopen($this->path().'.lock', 'c');
        if ($handle === false || ! flock($handle, LOCK_EX)) {
            throw new RuntimeException('Cannot lock installation. Check storage permissions.');
        }
        @chmod($this->path().'.lock', 0600);
        try {
            return $callback();
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    public function issue(bool $rotate = false): string
    {
        return $this->synchronized(function () use ($rotate) {
            if ($this->installer->isInstalled()) {
                throw new RuntimeException('This site is already installed.');
            }
            if (File::exists($this->path()) && ! $rotate) {
                throw new RuntimeException('A setup token was already issued. Use --rotate to replace it.');
            }
            $token = bin2hex(random_bytes(32));
            $stage = $this->stage();
            $this->write(['hash' => hash('sha256', $token), 'expires' => time() + 3600, 'owner' => null, 'stage' => $stage]);

            return $token;
        });
    }

    public function claimed(Request $request): bool
    {
        $record = $this->record();

        return is_string($record['owner'] ?? null)
            && ($record['expires'] ?? 0) > time()
            && hash_equals($record['owner'], hash('sha256', $request->session()->getId()));
    }

    public function claim(Request $request, string $token): void
    {
        $record = $this->record();
        if (($record['expires'] ?? 0) <= time() || ! is_string($record['hash'] ?? null)
            || ! hash_equals($record['hash'], hash('sha256', $token)) || ($record['owner'] ?? null) !== null) {
            throw ValidationException::withMessages(['setup_token' => 'The setup token is invalid, expired, or already claimed. Generate a new token on the server.']);
        }
        $record['owner'] = hash('sha256', $request->session()->getId());
        $this->write($record);
        $this->installer->beginInstall();
    }

    public function stage(): string
    {
        $stage = $this->record()['stage'] ?? 'database';

        return in_array($stage, ['database', 'administrator', 'site', 'done'], true) ? $stage : 'database';
    }

    /** Called while OwnInstallation holds the wizard lock. */
    public function advance(string $stage): void
    {
        $record = $this->record();
        $record['stage'] = $stage;
        $this->write($record);
    }

    /** @return array<string, mixed> */
    private function record(): array
    {
        if (! File::exists($this->path())) {
            return [];
        }
        $record = json_decode(File::get($this->path()), true);

        return is_array($record) ? $record : [];
    }

    /** @param array<string, mixed> $record */
    private function write(array $record): void
    {
        $temporary = $this->path().'.tmp';
        File::put($temporary, json_encode($record, JSON_THROW_ON_ERROR), true);
        @chmod($temporary, 0600);
        File::move($temporary, $this->path());
    }
}
