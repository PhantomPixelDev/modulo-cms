<?php

namespace App\Console\Commands;

use App\Models\EditorDraft;
use App\Models\Menu;
use App\Models\Post;
use App\Models\SiteSetting;
use App\Services\PostService;
use App\Services\SitemapBuilder;
use Database\Seeders\DemoContentSeeder;
use Illuminate\Console\Command;
use Illuminate\Console\ConfirmableTrait;
use Illuminate\Support\Facades\DB;

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

    protected $signature = 'modulo:seed-demo {--force : Run even in production}
        {--reset-content : Delete all demo posts, pages, products, menus and recovery drafts before seeding}';

    protected $description = 'Seed disposable demo users and example content';

    public function handle(): int
    {
        if ($this->option('reset-content') && (! config('demo.enabled') || ! $this->option('force'))) {
            $this->error('Replacing content requires a disposable site with MODULO_DEMO=true and --force.');

            return self::FAILURE;
        }
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
            DB::transaction(function () {
                if ($this->option('reset-content')) {
                    $this->warn('Removing all posts, pages, products, menus and recovery drafts. Back up this disposable site first.');
                    EditorDraft::query()->delete();
                    Post::withTrashed()->get()->each(fn (Post $post) => $post->forceDelete());
                    Menu::query()->delete();
                    // Page IDs from the old collection no longer exist.
                    SiteSetting::set('show_on_front', 'posts');
                    SiteSetting::set('front_page_id', null);
                    SiteSetting::set('posts_page_id', null);
                }

                $result = $this->call('db:seed', ['--class' => DemoContentSeeder::class, '--force' => true]);
                if ($result !== self::SUCCESS) {
                    throw new \RuntimeException('Demo seeding failed; database changes were rolled back.');
                }

                return $result;
            });
        } finally {
            config(['demo.seeding_authorized' => $previous]);
        }
        app(PostService::class)->flushCache();
        foreach ([null, 'en', 'es'] as $locale) {
            app(SitemapBuilder::class)->clearCachedXml($locale);
        }
        $this->info('Demo content seeded.');

        return self::SUCCESS;
    }
}
