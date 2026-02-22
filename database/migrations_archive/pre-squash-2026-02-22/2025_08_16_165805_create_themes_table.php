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
        Schema::create('themes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('version')->default('1.0.0');
            $table->text('description')->nullable();
            $table->string('author')->nullable();
            $table->string('author_url')->nullable();
            $table->string('screenshot')->nullable();
            $table->json('tags')->nullable();
            $table->json('supports')->nullable();
            $table->json('templates')->nullable();
            $table->json('partials')->nullable();
            $table->json('assets')->nullable();
            $table->json('customizer')->nullable();
            $table->json('menus')->nullable();
            $table->json('widget_areas')->nullable();
            $table->string('directory_path');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_installed')->default(false);
            $table->timestamp('installed_at')->nullable();
            $table->foreignId('installed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['slug', 'is_active']);
            $table->index('is_installed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('themes');
    }
};
