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
        Schema::create('post_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'post', 'page', 'product'
            $table->string('label'); // e.g., 'Posts', 'Pages', 'Products'
            $table->string('plural_label'); // e.g., 'Posts', 'Pages', 'Products'
            $table->text('description')->nullable();
            $table->boolean('has_taxonomies')->default(true);
            $table->boolean('has_featured_image')->default(true);
            $table->boolean('has_excerpt')->default(true);
            $table->boolean('has_comments')->default(true);
            $table->json('supports')->nullable(); // ['title', 'editor', 'thumbnail', 'excerpt', 'comments']
            $table->json('taxonomies')->nullable(); // ['category', 'post_tag']
            $table->string('slug')->unique(); // URL-friendly version
            $table->boolean('is_public')->default(true);
            $table->boolean('is_hierarchical')->default(false); // like pages
            $table->string('menu_icon')->nullable(); // icon class
            $table->integer('menu_position')->default(5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_types');
    }
};
