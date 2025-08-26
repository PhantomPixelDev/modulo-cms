<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if (Schema::hasTable('media_buckets')) {
            if ($driver === 'sqlite') {
                // Rebuild table for SQLite to drop unique index and add new columns
                Schema::create('media_buckets_new', function (Blueprint $table) {
                    $table->id();
                    $table->string('name');
                    $table->unsignedBigInteger('parent_id')->nullable();
                    $table->string('slug');
                    $table->string('path')->unique();
                    $table->softDeletes();
                    $table->timestamps();

                    $table->index('parent_id');
                    $table->unique(['parent_id', 'slug']);
                    // Foreign key optional on SQLite; keeping index is sufficient
                });

                // Copy data from old table and generate slug/path
                $rows = DB::table('media_buckets')->get();
                foreach ($rows as $row) {
                    $slug = Str::slug($row->name);
                    $path = $slug; // root-level path
                    DB::table('media_buckets_new')->insert([
                        'id' => $row->id,
                        'name' => $row->name,
                        'parent_id' => null,
                        'slug' => $slug,
                        'path' => $path,
                        'created_at' => $row->created_at,
                        'updated_at' => $row->updated_at,
                        'deleted_at' => null,
                    ]);
                }

                Schema::drop('media_buckets');
                Schema::rename('media_buckets_new', 'media_buckets');
            } else {
                // Non-SQLite: alter table in place
                Schema::table('media_buckets', function (Blueprint $table) {
                    // Drop unique index on name if exists
                    try {
                        $table->dropUnique('media_buckets_name_unique');
                    } catch (\Throwable $e) {
                        // ignore if not exists
                    }

                    $table->unsignedBigInteger('parent_id')->nullable()->after('name');
                    $table->string('slug')->after('parent_id');
                    $table->string('path')->after('slug');
                    $table->softDeletes();

                    $table->index('parent_id');
                    $table->unique(['parent_id', 'slug']);
                    $table->unique('path');

                    $table->foreign('parent_id')->references('id')->on('media_buckets')->nullOnDelete();
                });

                // Populate slug/path for existing rows
                $rows = DB::table('media_buckets')->get();
                foreach ($rows as $row) {
                    $slug = Str::slug($row->name);
                    $path = $slug;
                    DB::table('media_buckets')->where('id', $row->id)->update([
                        'slug' => $slug,
                        'path' => $path,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if (!Schema::hasTable('media_buckets')) {
            return;
        }

        if ($driver === 'sqlite') {
            // Rebuild back to original schema: id, name (unique), timestamps
            Schema::create('media_buckets_old', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->timestamps();
            });

            $rows = DB::table('media_buckets')->get();
            foreach ($rows as $row) {
                DB::table('media_buckets_old')->insert([
                    'id' => $row->id,
                    'name' => $row->name,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }

            Schema::drop('media_buckets');
            Schema::rename('media_buckets_old', 'media_buckets');
        } else {
            // Drop new columns and restore unique(name)
            Schema::table('media_buckets', function (Blueprint $table) {
                // Drop FKs & indexes if exist
                try { $table->dropForeign(['parent_id']); } catch (\Throwable $e) {}
                try { $table->dropUnique(['parent_id', 'slug']); } catch (\Throwable $e) {}
                try { $table->dropUnique('media_buckets_path_unique'); } catch (\Throwable $e) {}
                try { $table->dropIndex(['parent_id']); } catch (\Throwable $e) {}

                // Drop columns
                try { $table->dropColumn('parent_id'); } catch (\Throwable $e) {}
                try { $table->dropColumn('slug'); } catch (\Throwable $e) {}
                try { $table->dropColumn('path'); } catch (\Throwable $e) {}
                try { $table->dropSoftDeletes(); } catch (\Throwable $e) {}

                // Restore unique on name
                $table->unique('name');
            });
        }
    }
};
