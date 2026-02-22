<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_setting_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_setting_id')->constrained('site_settings')->cascadeOnDelete();
            $table->string('locale', 10);
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['site_setting_id', 'locale']);
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_setting_translations');
    }
};
