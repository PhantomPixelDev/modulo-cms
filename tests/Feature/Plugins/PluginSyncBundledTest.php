<?php

use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->syncRoot = sys_get_temp_dir().'/modulo-sync-'.bin2hex(random_bytes(4));
    $this->bundled = $this->syncRoot.'/bundled';
    $this->volume = $this->syncRoot.'/plugins';

    File::ensureDirectoryExists($this->bundled);
    File::ensureDirectoryExists($this->volume);
    config(['plugins.path' => $this->volume]);
});

afterEach(function () {
    File::deleteDirectory($this->syncRoot);
});

function writeSyncManifest(string $dir, string $version, string $marker = ''): void
{
    File::ensureDirectoryExists($dir);
    File::put($dir.'/plugin.json', json_encode(['slug' => 'demo', 'version' => $version]));
    File::put($dir.'/marker.txt', $marker);
}

it('copies a bundled plugin the volume does not have yet', function () {
    writeSyncManifest($this->bundled.'/Demo', '1.0.0', 'bundled');

    $this->artisan('plugin:sync-bundled', ['--from' => $this->bundled])->assertSuccessful();

    expect(File::get($this->volume.'/Demo/marker.txt'))->toBe('bundled');
});

it('upgrades a plugin when the image ships a newer version', function () {
    writeSyncManifest($this->bundled.'/Demo', '1.2.0', 'new');
    writeSyncManifest($this->volume.'/Demo', '1.1.0', 'old');

    $this->artisan('plugin:sync-bundled', ['--from' => $this->bundled])->assertSuccessful();

    expect(File::get($this->volume.'/Demo/marker.txt'))->toBe('new');
});

it('never downgrades a plugin updated from the registry', function () {
    // The owner updated to 2.0.0 after the image was built; a boot must not
    // quietly roll that back to the older copy baked into the image.
    writeSyncManifest($this->bundled.'/Demo', '1.0.0', 'bundled');
    writeSyncManifest($this->volume.'/Demo', '2.0.0', 'registry');

    $this->artisan('plugin:sync-bundled', ['--from' => $this->bundled])->assertSuccessful();

    expect(File::get($this->volume.'/Demo/marker.txt'))->toBe('registry');
});

it('leaves no staging or backup directories behind', function () {
    writeSyncManifest($this->bundled.'/Demo', '1.2.0');
    writeSyncManifest($this->volume.'/Demo', '1.1.0');

    $this->artisan('plugin:sync-bundled', ['--from' => $this->bundled])->assertSuccessful();

    expect(array_map('basename', File::directories($this->volume)))->toBe(['Demo']);
});
