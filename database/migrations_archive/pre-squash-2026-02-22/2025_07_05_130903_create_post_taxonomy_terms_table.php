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
        Schema::create('post_taxonomy_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->foreignId('taxonomy_term_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            // Ensure unique relationships
            $table->unique(['post_id', 'taxonomy_term_id']);
            
            // Indexes for better performance
            $table->index('post_id');
            $table->index('taxonomy_term_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_taxonomy_terms');
    }
};
