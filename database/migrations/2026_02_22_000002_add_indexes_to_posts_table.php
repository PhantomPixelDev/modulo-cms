<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Driver-agnostic existence check (pg_indexes broke SQLite test runs)
        $hasTypeIndex = Schema::hasIndex('posts', 'posts_type_status_published_idx');
        $hasAuthorIndex = Schema::hasIndex('posts', 'posts_author_status_idx');

        Schema::table('posts', function (Blueprint $table) use ($hasTypeIndex, $hasAuthorIndex) {
            if (!$hasTypeIndex) {
                $table->index(['post_type_id', 'status', 'published_at'], 'posts_type_status_published_idx');
            }
            if (!$hasAuthorIndex) {
                $table->index(['author_id', 'status'], 'posts_author_status_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex('posts_type_status_published_idx');
            $table->dropIndex('posts_author_status_idx');
        });
    }
};
