<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE posts ALTER COLUMN parent_id TYPE BIGINT USING parent_id::bigint');
            DB::statement('ALTER TABLE taxonomy_terms ALTER COLUMN parent_id TYPE BIGINT USING parent_id::bigint');

            DB::statement('CREATE INDEX IF NOT EXISTS posts_parent_id_idx ON posts (parent_id)');
            DB::statement('CREATE INDEX IF NOT EXISTS taxonomy_terms_parent_id_idx ON taxonomy_terms (parent_id)');

            DB::statement(<<<'SQL'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_parent_fk') THEN
        ALTER TABLE posts
            ADD CONSTRAINT posts_parent_fk
            FOREIGN KEY (parent_id)
            REFERENCES posts(id)
            ON DELETE SET NULL;
    END IF;
END$$;
SQL);

            DB::statement(<<<'SQL'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'taxonomy_terms_parent_fk') THEN
        ALTER TABLE taxonomy_terms
            ADD CONSTRAINT taxonomy_terms_parent_fk
            FOREIGN KEY (parent_id)
            REFERENCES taxonomy_terms(id)
            ON DELETE SET NULL;
    END IF;
END$$;
SQL);

            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE posts MODIFY parent_id BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE taxonomy_terms MODIFY parent_id BIGINT UNSIGNED NULL');

            DB::statement('CREATE INDEX posts_parent_id_idx ON posts (parent_id)');
            DB::statement('CREATE INDEX taxonomy_terms_parent_id_idx ON taxonomy_terms (parent_id)');

            DB::statement('ALTER TABLE posts ADD CONSTRAINT posts_parent_fk FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE SET NULL');
            DB::statement('ALTER TABLE taxonomy_terms ADD CONSTRAINT taxonomy_terms_parent_fk FOREIGN KEY (parent_id) REFERENCES taxonomy_terms(id) ON DELETE SET NULL');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_parent_fk');
            DB::statement('ALTER TABLE taxonomy_terms DROP CONSTRAINT IF EXISTS taxonomy_terms_parent_fk');

            DB::statement('DROP INDEX IF EXISTS posts_parent_id_idx');
            DB::statement('DROP INDEX IF EXISTS taxonomy_terms_parent_id_idx');

            DB::statement('ALTER TABLE posts ALTER COLUMN parent_id TYPE INTEGER USING parent_id::integer');
            DB::statement('ALTER TABLE taxonomy_terms ALTER COLUMN parent_id TYPE INTEGER USING parent_id::integer');

            return;
        }

        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE posts DROP FOREIGN KEY posts_parent_fk');
            DB::statement('ALTER TABLE taxonomy_terms DROP FOREIGN KEY taxonomy_terms_parent_fk');

            DB::statement('DROP INDEX posts_parent_id_idx ON posts');
            DB::statement('DROP INDEX taxonomy_terms_parent_id_idx ON taxonomy_terms');

            DB::statement('ALTER TABLE posts MODIFY parent_id INT NULL');
            DB::statement('ALTER TABLE taxonomy_terms MODIFY parent_id INT NULL');
        }
    }
};
