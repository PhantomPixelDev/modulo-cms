<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('translation_overrides', function (Blueprint $table) {
            $table->id();
            $table->string('locale', 10);
            $table->string('domain', 64);
            $table->string('key', 255);
            $table->text('value')->nullable();
            $table->timestamps();

            $table->unique(['locale', 'domain', 'key']);
            $table->index('domain');
            $table->index('locale');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('translation_overrides');
    }
};
