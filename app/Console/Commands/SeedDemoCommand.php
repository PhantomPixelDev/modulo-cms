<?php

namespace App\Console\Commands;

use Database\Seeders\DemoContentSeeder;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;

/**
 * Seeds sample users and content.
 *
 * Separate from `db:seed` and guarded, because the demo data includes accounts
 * whose passwords are published in the README. Running it against a live site
 * hands anyone who read the docs an administrator login.
 */
class SeedDemoCommand extends Command
{
    use ConfirmableTrait;

    protected $signature = 'modulo:seed-demo {--force : Run even in production}';

    protected $description = 'Seed disposable demo users and example content';

    public function handle(): int
    {
        if (app()->isProduction() && (! config('demo.enabled') || ! $this->option('force'))) {
            $this->error('Production demo seeding requires MODULO_DEMO=true and --force.');

            return self::FAILURE;
        }
        // Prompts in production, and refuses outright without --force when
        // there is no terminal to prompt on.
        if (! $this->confirmToProceed()) {
            return self::FAILURE;
        }

        $this->warn('Demo content includes accounts with publicly documented passwords.');

        $previous = config('demo.seeding_authorized', false);
        config(['demo.seeding_authorized' => true]);
        try {
            $exitCode = $this->call('db:seed', [
                '--class' => DemoContentSeeder::class,
                '--force' => true,
            ]);
        } finally {
            config(['demo.seeding_authorized' => $previous]);
        }
        if ($exitCode !== self::SUCCESS) {
            return $exitCode;
        }
        $this->info('Demo content seeded.');

        return self::SUCCESS;
    }
}
