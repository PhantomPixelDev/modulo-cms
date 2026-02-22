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
        Schema::table('post_types', function (Blueprint $table) {
            if (!Schema::hasColumn('post_types', 'show_in_menu')) {
                $table->boolean('show_in_menu')->default(true)->after('is_hierarchical');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_types', function (Blueprint $table) {
            if (Schema::hasColumn('post_types', 'show_in_menu')) {
                $table->dropColumn('show_in_menu');
            }
        });
    }
};
