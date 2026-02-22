<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('taxonomy_term_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('taxonomy_term_id')->constrained()->cascadeOnDelete();
            $table->string('locale', 8);
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->json('meta_data')->nullable();
            $table->timestamps();

            $table->unique(['taxonomy_term_id', 'locale']);
            $table->unique(['locale', 'slug']);
            $table->index('locale');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxonomy_term_translations');
    }
};
