<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('editor_drafts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('content_type', 20);
            $table->string('locale', 20);
            $table->json('payload');
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();
            $table->index(['user_id', 'post_id', 'locale']);
            $table->index('updated_at');
        });

        $locale = DB::table('locales')->where('is_default', true)->value('code') ?? 'en';
        DB::table('post_autosaves')->orderBy('id')->chunkById(100, function ($rows) use ($locale) {
            foreach ($rows as $row) {
                $type = DB::table('posts')->join('post_types', 'posts.post_type_id', '=', 'post_types.id')
                    ->where('posts.id', $row->post_id)->value('post_types.name');
                DB::table('editor_drafts')->insert([
                    'id' => (string) Str::uuid(), 'user_id' => $row->user_id,
                    'post_id' => $row->post_id, 'content_type' => $type === 'page' ? 'page' : 'post',
                    'locale' => $locale, 'payload' => json_encode([
                        'title' => $row->title, 'excerpt' => $row->excerpt, 'content' => $row->content,
                    ], JSON_THROW_ON_ERROR),
                    'revision' => 1, 'created_at' => $row->created_at, 'updated_at' => $row->updated_at,
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('editor_drafts');
    }
};
