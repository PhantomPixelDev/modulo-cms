<?php

use App\Services\Plugins\ArchiveExtractor;
use Illuminate\Support\Facades\File;

beforeEach(function () {
    $this->work = storage_path('framework/testing/archives-'.uniqid());
    File::ensureDirectoryExists($this->work);
});

afterEach(function () {
    File::deleteDirectory($this->work);
});

/**
 * @param  array<string, string>  $entries
 */
function makeZip(string $path, array $entries, ?callable $mutate = null): string
{
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);

    foreach ($entries as $name => $contents) {
        $zip->addFromString($name, $contents);
    }

    if ($mutate !== null) {
        $mutate($zip);
    }

    $zip->close();

    return $path;
}

it('extracts a well-formed plugin archive', function () {
    $archive = makeZip($this->work.'/good.zip', [
        'Fixture/plugin.json' => '{"slug":"fixture"}',
        'Fixture/src/Thing.php' => '<?php class Thing {}',
        'Fixture/README.md' => '# Fixture',
    ]);

    $destination = $this->work.'/out';
    app(ArchiveExtractor::class)->extract($archive, $destination);

    expect(File::exists($destination.'/Fixture/plugin.json'))->toBeTrue()
        ->and(File::exists($destination.'/Fixture/src/Thing.php'))->toBeTrue()
        ->and(File::get($destination.'/Fixture/plugin.json'))->toBe('{"slug":"fixture"}');
});

it('refuses an entry that escapes the destination', function () {
    // The classic zip-slip: extractTo() would happily write this.
    $archive = makeZip($this->work.'/traversal.zip', [
        'Fixture/plugin.json' => '{}',
        '../../../../etc/passwd' => 'pwned',
    ]);

    expect(fn () => app(ArchiveExtractor::class)->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'escapes the destination');

    expect(File::exists($this->work.'/out/Fixture/plugin.json'))->toBeFalse();
});

it('refuses an absolute path entry', function () {
    $archive = makeZip($this->work.'/absolute.zip', [
        '/etc/cron.d/backdoor' => 'malice',
    ]);

    expect(fn () => app(ArchiveExtractor::class)->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'absolute path');
});

it('refuses a symbolic link', function () {
    // A link pointing outside the destination turns any later write through it
    // into an arbitrary file write.
    $archive = makeZip($this->work.'/symlink.zip', [
        'Fixture/plugin.json' => '{}',
    ], function (ZipArchive $zip) {
        $zip->addFromString('Fixture/evil', '/etc/passwd');
        $index = $zip->locateName('Fixture/evil');
        // 0xA1FF0000 == symlink mode in the high bits of the external attributes.
        $zip->setExternalAttributesIndex($index, ZipArchive::OPSYS_UNIX, 0xA1FF << 16);
    });

    expect(fn () => app(ArchiveExtractor::class)->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'symbolic link');
});

it('refuses a file type a plugin has no business shipping', function () {
    $archive = makeZip($this->work.'/binary.zip', [
        'Fixture/plugin.json' => '{}',
        'Fixture/payload.so' => 'ELF',
    ]);

    expect(fn () => app(ArchiveExtractor::class)->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'disallowed extension');
});

it('allows PHP, because shipping PHP is what a plugin is', function () {
    $archive = makeZip($this->work.'/php.zip', [
        'Fixture/plugin.json' => '{}',
        'Fixture/FixtureServiceProvider.php' => '<?php',
        'Fixture/resources/views/form.blade.php' => '<form></form>',
    ]);

    app(ArchiveExtractor::class)->extract($archive, $this->work.'/out');

    expect(File::exists($this->work.'/out/Fixture/resources/views/form.blade.php'))->toBeTrue();
});

it('refuses an archive with too many entries', function () {
    $entries = ['Fixture/plugin.json' => '{}'];
    for ($i = 0; $i < ArchiveExtractor::MAX_ENTRIES + 10; $i++) {
        $entries['Fixture/f'.$i.'.txt'] = 'x';
    }

    $archive = makeZip($this->work.'/many.zip', $entries);

    expect(fn () => app(ArchiveExtractor::class)->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'more than');
});

it('refuses an entry that expands beyond the per-file limit', function () {
    // Lowered limits rather than allocating 64MB: the logic under test is the
    // ceiling, not the number.
    $extractor = new class extends ArchiveExtractor
    {
        public const MAX_ENTRY_BYTES = 512;
    };

    $archive = makeZip($this->work.'/bomb.zip', [
        'Fixture/plugin.json' => '{}',
        // Highly compressible, so the archive stays small while the declared
        // size does not -- the shape of a zip bomb.
        'Fixture/huge.txt' => str_repeat('A', 4096),
    ]);

    expect(fn () => $extractor->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'over the per-file limit');
});

it('refuses an archive whose entries together exceed the total limit', function () {
    $extractor = new class extends ArchiveExtractor
    {
        public const MAX_TOTAL_BYTES = 2048;
    };

    $archive = makeZip($this->work.'/total.zip', [
        'Fixture/plugin.json' => '{}',
        'Fixture/a.txt' => str_repeat('A', 1024),
        'Fixture/b.txt' => str_repeat('B', 1024),
        'Fixture/c.txt' => str_repeat('C', 1024),
    ]);

    expect(fn () => $extractor->extract($archive, $this->work.'/out'))
        ->toThrow(RuntimeException::class, 'expands to more than');
});

it('writes nothing at all when any entry is rejected', function () {
    $archive = makeZip($this->work.'/mixed.zip', [
        'Fixture/plugin.json' => '{}',
        'Fixture/ok.php' => '<?php',
        'Fixture/bad.exe' => 'MZ',
    ]);

    $destination = $this->work.'/out';

    expect(fn () => app(ArchiveExtractor::class)->extract($archive, $destination))
        ->toThrow(RuntimeException::class);

    // Validation runs over the whole archive first, so a rejected entry cannot
    // leave a half-written plugin behind.
    expect(File::exists($destination.'/Fixture/ok.php'))->toBeFalse();
});

it('refuses an entry whose name contains a null byte', function () {
    $archive = makeZip($this->work.'/nul.zip', [
        'Fixture/plugin.json' => '{}',
    ]);

    // Not constructible through addFromString, so assert the guard directly.
    $extractor = new class extends ArchiveExtractor
    {
        public function check(string $name): void
        {
            $this->assertSafeName($name);
        }
    };

    expect(fn () => $extractor->check("Fixture/evil\0.php"))
        ->toThrow(RuntimeException::class, 'null byte');
});
