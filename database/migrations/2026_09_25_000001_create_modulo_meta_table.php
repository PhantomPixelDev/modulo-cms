<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A small key/value table for facts about the installation itself, starting
 * with the Modulo version the schema was last upgraded to.
 *
 * Deliberately not site_settings: those are editable, cached, translatable
 * content settings, and this must be written only by install and upgrade.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modulo_meta', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('modulo_meta');
    }
};
