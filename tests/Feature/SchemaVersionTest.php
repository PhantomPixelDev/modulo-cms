<?php

use App\Services\UpgradePreflight;
use App\Support\SchemaVersion;
use App\Support\Version;
use Illuminate\Support\Facades\DB;

function recordSchemaVersion(string $version): void
{
    DB::table('modulo_meta')->updateOrInsert(['key' => SchemaVersion::KEY], ['value' => $version]);
    cache()->forget('modulo:schema-version');
}

it('records the running version as the schema version', function () {
    config(['version.version' => '1.4.0']);

    SchemaVersion::recordCurrent();

    expect(SchemaVersion::recorded())->toBe('1.4.0')
        ->and(SchemaVersion::isAheadOfCode())->toBeFalse();
});

it('never records a development build', function () {
    config(['version.version' => '1.4.0-dev']);

    SchemaVersion::recordCurrent();

    expect(SchemaVersion::recorded())->toBeNull();
});

it('treats any -dev version as a development build', function () {
    config(['version.version' => '0.1.2-dev']);

    expect(Version::isDev())->toBeTrue();
});

it('refuses to serve when a newer version already migrated the database', function () {
    config(['version.version' => '1.4.0']);
    recordSchemaVersion('1.5.0');

    $this->get('/')
        ->assertStatus(503)
        ->assertSee('upgraded by Modulo 1.5.0', false)
        ->assertSee('this is Modulo 1.4.0', false);
});

it('keeps serving when the schema matches or is older', function () {
    config(['version.version' => '1.5.0']);
    recordSchemaVersion('1.4.0');

    expect(SchemaVersion::isAheadOfCode())->toBeFalse();
    $this->get('/health')->assertJsonPath('checks.schema', true);
});

it('reports the mismatch on the health probe instead of hiding it', function () {
    config(['version.version' => '1.4.0']);
    recordSchemaVersion('1.5.0');

    $this->getJson('/health')
        ->assertStatus(503)
        ->assertJsonPath('schema_version', '1.5.0')
        ->assertJsonPath('checks.schema', false);
});

it('blocks modulo:upgrade from an older build', function () {
    config(['version.version' => '1.4.0']);
    recordSchemaVersion('1.5.0');

    $preflight = app(UpgradePreflight::class);

    expect($preflight->blockers($preflight->run([])))->toHaveCount(1);
});
