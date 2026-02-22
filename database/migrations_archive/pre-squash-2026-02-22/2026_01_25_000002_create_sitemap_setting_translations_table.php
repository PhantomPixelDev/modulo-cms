<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sitemap_setting_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sitemap_setting_id')
                ->constrained('sitemap_settings')
                ->cascadeOnDelete();
            $table->string('locale', 10);
            $table->json('included_post_type_ids')->nullable();
            $table->boolean('include_taxonomies')->nullable();
            $table->json('custom_urls')->nullable();
            $table->timestamps();

            $table->unique(['sitemap_setting_id', 'locale']);
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sitemap_setting_translations');
    }
};
