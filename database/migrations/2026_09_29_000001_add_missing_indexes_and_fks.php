<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        // parent_id indexes exist on PostgreSQL/MySQL already; SQLite skips
        // them in the earlier migration, so add them there.
        // (SQLite cannot add foreign keys after table creation, so the
        // self-referencing parent FKs intentionally stay pgsql/mysql-only.)
        if ($driver === 'sqlite') {
            Schema::table('posts', function (Blueprint $table) {
                $table->index('parent_id');
            });

            Schema::table('taxonomy_terms', function (Blueprint $table) {
                $table->index('parent_id');
            });

            Schema::table('media_buckets', function (Blueprint $table) {
                $table->index('parent_id');
            });
        }

        // Add missing standalone indexes
        Schema::table('comments', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('post_revisions', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('api_tokens', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('last_used_at');
            $table->index('expires_at');
        });

        Schema::table('activity_log', function (Blueprint $table) {
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::table('posts', function (Blueprint $table) {
                $table->dropIndex(['parent_id']);
            });

            Schema::table('taxonomy_terms', function (Blueprint $table) {
                $table->dropIndex(['parent_id']);
            });

            Schema::table('media_buckets', function (Blueprint $table) {
                $table->dropIndex(['parent_id']);
            });
        }

        Schema::table('comments', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('post_revisions', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('api_tokens', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->dropIndex(['last_used_at']);
            $table->dropIndex(['expires_at']);
        });

        Schema::table('activity_log', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });
    }
};
