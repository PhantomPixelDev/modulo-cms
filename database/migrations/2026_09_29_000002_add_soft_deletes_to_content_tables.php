<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('post_types', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('taxonomies', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('taxonomy_terms', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('post_types', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('taxonomies', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('taxonomy_terms', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('menus', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
