<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sitemap_settings', function (Blueprint $table) {
            $table->id();
            $table->json('included_post_type_ids')->nullable();
            $table->boolean('include_taxonomies')->default(true);
            $table->boolean('enable_cache')->default(true);
            $table->integer('cache_ttl')->default(3600); // seconds
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sitemap_settings');
    }
};
