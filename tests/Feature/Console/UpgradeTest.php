<?php

use App\Models\Post;
use App\Models\PostType;
use App\Models\User;
use App\Services\UpgradePreflight;
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
