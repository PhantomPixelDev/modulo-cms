<?php

namespace App\Services;

use App\Support\SchemaVersion;
use App\Support\Version;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * Checks run before an upgrade migrates anything.
 *
 * Some migrations in this project cannot be made safe by retrying: they change
 * a column type and then add a constraint, so a failure leaves the schema
 * half-converted. The cheapest fix is to find out beforehand, name the rows
 * responsible, and refuse.
 *
 * A check is keyed by the migration it guards, and only runs when that
 * migration is actually pending.
 */
class UpgradePreflight
{
    public const OK = 'ok';

    public const WARNING = 'warning';

    public const BLOCKER = 'blocker';

    /**
     * Run every check whose migration is pending.
     *
     * @param  array<int, string>  $pendingMigrations  bare migration names, no .php
     * @return array<int, array{status: string, title: string, detail: string}>
     */
    public function run(array $pendingMigrations): array
    {
        $results = [];

        // Not tied to a migration: running an older build's upgrade against a
        // schema a newer one already migrated is wrong whatever is pending.
        if (SchemaVersion::isAheadOfCode()) {
            $results[] = [
                'status' => self::BLOCKER,
                'title' => 'This database was upgraded by a newer Modulo',
                'detail' => sprintf(
                    'The schema was last upgraded by %s; this is %s. Deploy %s or newer, or restore the backup taken before that upgrade.',
                    SchemaVersion::recorded(),
                    Version::current(),
                    SchemaVersion::recorded(),
                ),
            ];
        }

        foreach ($this->checks() as $migration => $check) {
            foreach ($pendingMigrations as $pending) {
                if (str_contains($pending, $migration)) {
                    $results[] = $check();
                    break;
                }
            }
        }

        return $results;
    }

    /**
     * @return array<int, array{status: string, title: string, detail: string}>
     */
    public function blockers(array $results): array
    {
        return array_values(array_filter($results, fn (array $r) => $r['status'] === self::BLOCKER));
    }

    /**
     * @return array<string, callable(): array{status: string, title: string, detail: string}>
     */
    protected function checks(): array
    {
        return [
            'align_parent_ids_to_bigint' => fn () => $this->checkParentIdOrphans(),
            'add_search_vector_to_posts_table' => fn () => $this->checkSearchVectorCost(),
        ];
    }

    /**
     * The migration adds self-referencing foreign keys on posts.parent_id and
     * taxonomy_terms.parent_id with no cleanup first. A row pointing at an id
     * that no longer exists makes ADD CONSTRAINT fail -- after the column type
     * has already been rewritten.
     *
     * @return array{status: string, title: string, detail: string}
     */
    protected function checkParentIdOrphans(): array
    {
        $offenders = [];

        foreach (['posts', 'taxonomy_terms'] as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'parent_id')) {
                continue;
            }

            try {
                $rows = DB::table($table)
                    ->whereNotNull('parent_id')
                    ->whereNotIn('parent_id', fn ($q) => $q->select('id')->from($table))
                    ->limit(20)
                    ->pluck('id')
                    ->all();
            } catch (Throwable $e) {
                return [
                    'status' => self::WARNING,
                    'title' => "Could not check {$table} for orphaned parents",
                    'detail' => $e->getMessage(),
                ];
            }

            if ($rows !== []) {
                $offenders[$table] = $rows;
            }
        }

        if ($offenders === []) {
            return [
                'status' => self::OK,
                'title' => 'Parent references are consistent',
                'detail' => 'No orphaned parent_id values in posts or taxonomy_terms.',
            ];
        }

        $detail = [];
        foreach ($offenders as $table => $ids) {
            $detail[] = "{$table}: ids ".implode(', ', $ids);
        }

        return [
            'status' => self::BLOCKER,
            'title' => 'Orphaned parent references would fail the migration',
            'detail' => implode(' | ', $detail)
                .' -- set these rows\' parent_id to NULL, or point them at a row that exists, then run the upgrade again.',
        ];
    }

    /**
     * Adding a generated tsvector column rewrites the whole posts table and
     * builds a GIN index without CONCURRENTLY, holding a heavy lock. That is
     * survivable under maintenance mode but should not be a surprise.
     *
     * @return array{status: string, title: string, detail: string}
     */
    protected function checkSearchVectorCost(): array
    {
        if (DB::getDriverName() !== 'pgsql') {
            return [
                'status' => self::OK,
                'title' => 'Full-text index not applicable',
                'detail' => 'This migration only runs on PostgreSQL.',
            ];
        }

        try {
            $count = Schema::hasTable('posts') ? DB::table('posts')->count() : 0;
        } catch (Throwable $e) {
            return [
                'status' => self::WARNING,
                'title' => 'Could not measure the posts table',
                'detail' => $e->getMessage(),
            ];
        }

        return [
            'status' => $count > 50_000 ? self::WARNING : self::OK,
            'title' => 'Full-text index will rewrite the posts table',
            'detail' => number_format($count).' posts. The table is rewritten and a GIN index built '
                .'without CONCURRENTLY, so writes to posts block for the duration.',
        ];
    }
}
