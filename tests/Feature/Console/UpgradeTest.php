<?php

use App\Console\Commands\BackupDatabaseCommand;
use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use App\Services\UpgradePreflight;
use Illuminate\Database\Console\Migrations\MigrateCommand;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Create a row whose parent_id points nowhere.
 *
 * On PostgreSQL the foreign key this guards against already exists, so the
 * database refuses the insert. That is the point: the preflight is about
 * databases written *before* that migration ran, so the constraint is dropped
 * to reproduce them. SQLite does not enforce it and needs no such help.
 */
function makeOrphanedPost(): Post
{
    $post = preflightPost();

    if (DB::getDriverName() === 'pgsql') {
        DB::statement('ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_parent_fk');
    }

    DB::table('posts')->where('id', $post->id)->update(['parent_id' => 999_999]);

    return $post;
}

function preflightPost(): Post
{
    $type = PostType::firstOrCreate(
        ['name' => 'post'],
        ['label' => 'Post', 'plural_label' => 'Posts', 'slug' => 'post', 'is_public' => true]
    );

    return Post::create([
        'title' => 'Preflight subject',
        'slug' => 'preflight-subject-'.uniqid(),
        'content' => 'x',
        'status' => 'draft',
        'post_type_id' => $type->id,
        'author_id' => User::factory()->create()->id,
    ]);
}

it('passes when parent references are consistent', function () {
    $parent = preflightPost();
    $child = preflightPost();
    $child->update(['parent_id' => $parent->id]);

    $results = app(UpgradePreflight::class)->run(['2026_02_22_000003_align_parent_ids_to_bigint']);

    expect($results)->toHaveCount(1)
        ->and($results[0]['status'])->toBe(UpgradePreflight::OK);
});

it('blocks the upgrade when a post points at a parent that does not exist', function () {
    $orphan = makeOrphanedPost();

    $preflight = app(UpgradePreflight::class);
    $results = $preflight->run(['2026_02_22_000003_align_parent_ids_to_bigint']);
    $blockers = $preflight->blockers($results);

    expect($blockers)->toHaveCount(1)
        ->and($blockers[0]['status'])->toBe(UpgradePreflight::BLOCKER)
        // The row id has to be in the message: "something is wrong somewhere"
        // is not actionable at 3am.
        ->and($blockers[0]['detail'])->toContain((string) $orphan->id)
        ->and($blockers[0]['detail'])->toContain('posts');
});

it('only runs checks for migrations that are actually pending', function () {
    $orphan = makeOrphanedPost();

    // The orphan is present, but that migration is not pending, so no check
    // should fire and nothing should block.
    $results = app(UpgradePreflight::class)->run(['9999_01_01_000000_some_unrelated_migration']);

    expect($results)->toBe([]);
});

it('reports the cost of the full-text index migration', function () {
    $results = app(UpgradePreflight::class)->run(['2026_09_20_000002_add_search_vector_to_posts_table']);

    expect($results)->toHaveCount(1)
        ->and($results[0]['status'])->not->toBe(UpgradePreflight::BLOCKER);
});

it('changes nothing on a dry run', function () {
    $orphan = makeOrphanedPost();

    // Nothing is pending in a freshly migrated database, so this succeeds --
    // the point is that it touched nothing on the way through.
    $this->artisan('modulo:upgrade', ['--dry-run' => true])->assertSuccessful();

    expect(DB::table('posts')->where('id', $orphan->id)->value('parent_id'))->toBe(999_999)
        ->and(app()->isDownForMaintenance())->toBeFalse();
});

it('refuses to upgrade while a blocker stands', function () {
    // Drive the command's decision, not the preflight's detection, which the
    // checks above already cover. A pending migration cannot be simulated in a
    // database RefreshDatabase has just brought fully up to date.
    app()->bind(UpgradePreflight::class, fn () => new class extends UpgradePreflight
    {
        public function run(array $pendingMigrations): array
        {
            return [[
                'status' => UpgradePreflight::BLOCKER,
                'title' => 'Simulated blocker',
                'detail' => 'posts: ids 1',
            ]];
        }
    });

    $this->artisan('modulo:upgrade', ['--dry-run' => true])
        ->expectsOutputToContain('Simulated blocker')
        ->assertFailed();
});

it('proceeds past a blocker when forced', function () {
    app()->bind(UpgradePreflight::class, fn () => new class extends UpgradePreflight
    {
        public function run(array $pendingMigrations): array
        {
            return [[
                'status' => UpgradePreflight::BLOCKER,
                'title' => 'Simulated blocker',
                'detail' => 'ignored under --force',
            ]];
        }
    });

    $this->artisan('modulo:upgrade', ['--dry-run' => true, '--force' => true])->assertSuccessful();
});

/**
 * Swap modulo:db-backup for one that succeeds or fails on demand, so the
 * upgrade's decisions can be tested without pg_dump or a file-based database.
 */
function fakeBackup(bool $succeeds): void
{
    app()->bind(BackupDatabaseCommand::class, fn () => new class($succeeds) extends BackupDatabaseCommand
    {
        public function __construct(private bool $succeeds)
        {
            parent::__construct();
        }

        public function handle(): int
        {
            if (! $this->succeeds) {
                $this->error('Simulated: disk full');

                return self::FAILURE;
            }

            $this->info('Backup written to /tmp/simulated-backup.sql (1 KB)');

            return self::SUCCESS;
        }
    });
}

it('stops before touching anything when the backup fails', function () {
    fakeBackup(false);

    $this->artisan('modulo:upgrade')
        ->expectsOutputToContain('the database backup failed')
        ->assertFailed();

    // No maintenance window was opened for an upgrade that never started.
    expect(app()->isDownForMaintenance())->toBeFalse();
});

it('leaves the site in maintenance mode when a migration fails', function () {
    fakeBackup(true);

    app()->bind(MigrateCommand::class, fn ($app) => new class($app['migrator'], $app['events']) extends MigrateCommand
    {
        public function handle()
        {
            $this->error('Simulated: column already exists');

            return self::FAILURE;
        }
    });

    try {
        $this->artisan('modulo:upgrade')
            ->expectsOutputToContain('left in maintenance mode')
            ->expectsOutputToContain('/tmp/simulated-backup.sql')
            ->assertFailed();

        expect(app()->isDownForMaintenance())->toBeTrue();
    } finally {
        // The file-based maintenance flag outlives the test otherwise.
        Artisan::call('up');
    }
});
