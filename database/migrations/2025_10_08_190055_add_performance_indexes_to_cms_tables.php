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
        // Posts table - Critical for frontend performance
        Schema::table('posts', function (Blueprint $table) {
            // Index for URL slug lookups (most common query)
            try { $table->index('slug', 'posts_slug_idx'); } catch (\Throwable $e) {}

            // Index for status filtering (published/draft)
            try { $table->index('status', 'posts_status_idx'); } catch (\Throwable $e) {}

            // Index for published date sorting and filtering
            try { $table->index('published_at', 'posts_published_at_idx'); } catch (\Throwable $e) {}

            // Composite index for common queries (type + status + date)
            try { $table->index(['post_type_id', 'status', 'published_at'], 'posts_type_status_published_idx'); } catch (\Throwable $e) {}

            // Index for author filtering
            try { $table->index('author_id', 'posts_author_id_idx'); } catch (\Throwable $e) {}
        });

        // Post Types table - Critical for routing
        Schema::table('post_types', function (Blueprint $table) {
            // Index for slug lookups (admin routes)
            try { $table->index('slug', 'post_types_slug_idx'); } catch (\Throwable $e) {}

            // Index for route prefix (frontend routing)
            try { $table->index('route_prefix', 'post_types_route_prefix_idx'); } catch (\Throwable $e) {}

            // Index for public status (route registration)
            try { $table->index('is_public', 'post_types_is_public_idx'); } catch (\Throwable $e) {}
        });

        // Users table - Critical for authentication
        Schema::table('users', function (Blueprint $table) {
            // Index for email lookups (login, auth)
            try { $table->index('email', 'users_email_idx'); } catch (\Throwable $e) {}

            // Index for admin status (role checks)
            try { $table->index('is_admin', 'users_is_admin_idx'); } catch (\Throwable $e) {}
        });

        // Taxonomy Terms table - Critical for category/tag pages
        Schema::table('taxonomy_terms', function (Blueprint $table) {
            // Index for slug lookups (URL generation)
            try { $table->index('slug', 'taxonomy_terms_slug_idx'); } catch (\Throwable $e) {}

            // Index for taxonomy filtering (category/tag pages)
            try { $table->index('taxonomy_id', 'taxonomy_terms_taxonomy_id_idx'); } catch (\Throwable $e) {}

            // Composite index for taxonomy + slug (most common query)
            try { $table->index(['taxonomy_id', 'slug'], 'taxonomy_terms_taxonomy_slug_idx'); } catch (\Throwable $e) {}
        });

        // Menus table - For navigation performance
        Schema::table('menus', function (Blueprint $table) {
            // Index for slug lookups (menu retrieval)
            try { $table->index('slug', 'menus_slug_idx'); } catch (\Throwable $e) {}
        });

        // Menu Items table - For navigation performance
        Schema::table('menu_items', function (Blueprint $table) {
            // Index for menu filtering
            try { $table->index('menu_id', 'menu_items_menu_id_idx'); } catch (\Throwable $e) {}

            // Index for ordering
            try { $table->index('order', 'menu_items_order_idx'); } catch (\Throwable $e) {}

            // Index for parent relationships
            try { $table->index('parent_id', 'menu_items_parent_id_idx'); } catch (\Throwable $e) {}
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Posts table
        Schema::table('posts', function (Blueprint $table) {
            try { $table->dropIndex('posts_slug_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('posts_status_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('posts_published_at_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('posts_type_status_published_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('posts_author_id_idx'); } catch (\Throwable $e) {}
        });

        // Post Types table
        Schema::table('post_types', function (Blueprint $table) {
            try { $table->dropIndex('post_types_slug_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('post_types_route_prefix_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('post_types_is_public_idx'); } catch (\Throwable $e) {}
        });

        // Users table
        Schema::table('users', function (Blueprint $table) {
            try { $table->dropIndex('users_email_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('users_is_admin_idx'); } catch (\Throwable $e) {}
        });

        // Taxonomy Terms table
        Schema::table('taxonomy_terms', function (Blueprint $table) {
            try { $table->dropIndex('taxonomy_terms_slug_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('taxonomy_terms_taxonomy_id_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('taxonomy_terms_taxonomy_slug_idx'); } catch (\Throwable $e) {}
        });

        // Menus table
        Schema::table('menus', function (Blueprint $table) {
            try { $table->dropIndex('menus_slug_idx'); } catch (\Throwable $e) {}
        });

        // Menu Items table
        Schema::table('menu_items', function (Blueprint $table) {
            try { $table->dropIndex('menu_items_menu_id_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('menu_items_order_idx'); } catch (\Throwable $e) {}
            try { $table->dropIndex('menu_items_parent_id_idx'); } catch (\Throwable $e) {}
        });
    }
};
