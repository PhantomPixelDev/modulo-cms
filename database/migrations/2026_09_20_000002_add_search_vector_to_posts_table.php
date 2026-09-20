<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Full-text search index for PostgreSQL. Other drivers (SQLite in tests) keep
 * using the LIKE fallback in SearchController.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql' || Schema::hasColumn('posts', 'search_vector')) {
            return;
        }

        // 'simple' rather than 'english': the CMS is multilingual
        DB::statement(<<<'SQL'
            ALTER TABLE posts ADD COLUMN search_vector tsvector
            GENERATED ALWAYS AS (
                setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
                setweight(to_tsvector('simple', coalesce(content, '')), 'C')
            ) STORED
        SQL);

        DB::statement('CREATE INDEX IF NOT EXISTS posts_search_vector_idx ON posts USING GIN (search_vector)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS posts_search_vector_idx');

        if (Schema::hasColumn('posts', 'search_vector')) {
            DB::statement('ALTER TABLE posts DROP COLUMN search_vector');
        }
    }
};
