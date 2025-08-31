<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // posts
        Schema::table('posts', function (Blueprint $table) {
            try { $table->index('parent_id', 'posts_parent_id_hot_idx'); } catch (\Throwable $e) {}
            try { $table->index(['post_type_id', 'published_at'], 'posts_type_published_hot_idx'); } catch (\Throwable $e) {}
            try { $table->index(['post_type_id', 'status', 'published_at'], 'posts_type_status_published_hot_idx'); } catch (\Throwable $e) {}
        });

        // menu_items
        Schema::table('menu_items', function (Blueprint $table) {
            try { $table->index('menu_id', 'menu_items_menu_id_hot_idx'); } catch (\Throwable $e) {}
            try { $table->index('parent_id', 'menu_items_parent_id_hot_idx'); } catch (\Throwable $e) {}
            try { $table->index('order', 'menu_items_order_hot_idx'); } catch (\Throwable $e) {}
        });

        // taxonomy_terms
        Schema::table('taxonomy_terms', function (Blueprint $table) {
            try { $table->index(['taxonomy_id', 'slug'], 'taxonomy_terms_taxonomy_slug_hot_idx'); } catch (\Throwable $e) {}
        });

        // menus
        Schema::table('menus', function (Blueprint $table) {
            try { $table->index('slug', 'menus_slug_hot_idx'); } catch (\Throwable $e) {}
        });
    }

    public function down(): void
    {
        // posts
        Schema::table('posts', function (Blueprint $table) {
            try { $table->dropIndex('posts_parent_id_hot_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('posts_type_published_hot_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('posts_type_status_published_hot_idx'); } catch (\Throwable $e) {}
        });

        // menu_items
        Schema::table('menu_items', function (Blueprint $table) {
            try { $table->dropIndex('menu_items_menu_id_hot_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('menu_items_parent_id_hot_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('menu_items_order_hot_idx'); } catch (\Throwable $e) {}
        });

        // taxonomy_terms
        Schema::table('taxonomy_terms', function (Blueprint $table) {
            try { $table->dropIndex('taxonomy_terms_taxonomy_slug_hot_idx'); } catch (\Throwable $e) {}
        });

        // menus
        Schema::table('menus', function (Blueprint $table) {
            try { $table->dropIndex('menus_slug_hot_idx'); } catch (\Throwable $e) {}
        });
    }
};
