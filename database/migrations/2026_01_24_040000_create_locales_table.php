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
        Schema::create('locales', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // e.g., 'en', 'es', 'fr', 'de'
            $table->string('name', 100); // e.g., 'English', 'Spanish'
            $table->string('native_name', 100)->nullable(); // e.g., 'Español', 'Français'
            $table->string('direction', 3)->default('ltr'); // 'ltr' or 'rtl'
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        // Add locale preference to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('locale', 10)->nullable()->after('remember_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('locale');
        });

        Schema::dropIfExists('locales');
    }
};
