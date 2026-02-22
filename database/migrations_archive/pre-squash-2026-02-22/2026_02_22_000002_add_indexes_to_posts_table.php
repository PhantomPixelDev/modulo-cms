<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $indexes = \DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'posts'");
        $existing = array_column($indexes, 'indexname');

        Schema::table('posts', function (Blueprint $table) use ($existing) {
            if (!in_array('posts_type_status_published_idx', $existing)) {
                $table->index(['post_type_id', 'status', 'published_at'], 'posts_type_status_published_idx');
            }
            if (!in_array('posts_author_status_idx', $existing)) {
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
