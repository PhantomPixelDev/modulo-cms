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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_type_id')->constrained()->onDelete('cascade');
            $table->foreignId('author_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'published', 'private', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->integer('parent_id')->nullable(); // for hierarchical post types like pages
            $table->integer('menu_order')->default(0); // for ordering
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->json('meta_data')->nullable(); // for custom meta fields
            $table->integer('view_count')->default(0);
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['post_type_id', 'status']);
            $table->index(['author_id', 'status']);
            $table->index(['status', 'published_at']);
            $table->index('slug');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
