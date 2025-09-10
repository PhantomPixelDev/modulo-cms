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
            $table->unsignedBigInteger('single_template_id')->nullable()->after('route_prefix');
            $table->unsignedBigInteger('archive_template_id')->nullable()->after('single_template_id');
            
            $table->foreign('single_template_id')->references('id')->on('templates')->onDelete('set null');
            $table->foreign('archive_template_id')->references('id')->on('templates')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('post_types', function (Blueprint $table) {
            $table->dropForeign(['single_template_id']);
            $table->dropForeign(['archive_template_id']);
            $table->dropColumn(['single_template_id', 'archive_template_id']);
        });
    }
};
