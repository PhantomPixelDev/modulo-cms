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
        Schema::create('taxonomies', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., 'category', 'post_tag', 'product_category'
            $table->string('label'); // e.g., 'Categories', 'Tags', 'Product Categories'
            $table->string('plural_label'); // e.g., 'Categories', 'Tags', 'Product Categories'
            $table->text('description')->nullable();
            $table->string('slug')->unique(); // URL-friendly version
            $table->boolean('is_hierarchical')->default(false); // categories are hierarchical, tags are not
            $table->boolean('is_public')->default(true);
            $table->json('post_types')->nullable(); // which post types this taxonomy applies to
            $table->boolean('show_in_menu')->default(true);
            $table->string('menu_icon')->nullable();
            $table->integer('menu_position')->default(5);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxonomies');
    }
};
