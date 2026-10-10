<?php

namespace App\Console\Commands;

use App\Services\InstallOwnership;
use Illuminate\Console\Command;
use RuntimeException;

class InstallTokenCommand extends Command
{
    protected $signature = 'modulo:install-token {--rotate : Replace an existing setup claim}';

    protected $description = 'Issue a one-time web setup token, valid for one hour';

    public function handle(InstallOwnership $ownership): int
    {
        try {
            $this->line($ownership->issue((bool) $this->option('rotate')));

            return self::SUCCESS;
        } catch (RuntimeException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
