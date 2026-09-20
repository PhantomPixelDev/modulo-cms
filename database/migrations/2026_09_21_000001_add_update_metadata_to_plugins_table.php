<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a plugin came from and what it needs, so it can be updated later.
 *
 * Until now the plugins table recorded only what the manifest said about
 * itself, with no way to tell a bundled package from one fetched remotely and
 * nothing to check compatibility against.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plugins', function (Blueprint $table) {
            // local: shipped with the core. registry/url: fetched.
            $table->string('source')->default('local')->after('service_provider');
            $table->string('source_url')->nullable()->after('source');
            $table->string('checksum')->nullable()->after('source_url');

            // Discovered from the registry, compared against `version`.
            $table->string('available_version')->nullable()->after('version');
            $table->timestamp('last_checked_at')->nullable()->after('installed_at');

            // Compatibility, evaluated against the core version.
            $table->string('min_core_version')->nullable()->after('available_version');
            $table->json('requires')->nullable()->after('min_core_version');
        });
    }

    public function down(): void
    {
        Schema::table('plugins', function (Blueprint $table) {
            $table->dropColumn([
                'source',
                'source_url',
                'checksum',
                'available_version',
                'last_checked_at',
                'min_core_version',
                'requires',
            ]);
        });
    }
};
