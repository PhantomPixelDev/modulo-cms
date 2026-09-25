<?php

namespace App\Services\Plugins;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Downloads a registry package and proves it is the one the registry
 * promised. Shared by the plugin and theme installers.
 */
class PackageDownloader
{
    /**
     * @throws RuntimeException
     */
    public function download(string $url, string $destination): void
    {
        try {
            $response = Http::timeout((int) config('plugins.timeout'))
                // GitHub answers release downloads with a redirect to its asset
                // CDN. Follow it, but never down to plain HTTP; the checksum
                // is what guarantees the bytes either way.
                ->withOptions([
                    'sink' => $destination,
                    'allow_redirects' => ['max' => 5, 'protocols' => ['https'], 'strict' => true],
                ])
                ->get($url);
        } catch (Throwable $e) {
            throw new RuntimeException('Could not download the package: '.$e->getMessage());
        }

        if (! $response->successful()) {
            throw new RuntimeException('Downloading the package returned '.$response->status().'.');
        }

        if (! File::exists($destination) || File::size($destination) === 0) {
            throw new RuntimeException('The downloaded package is empty.');
        }
    }

    /**
     * @throws RuntimeException
     */
    public function verifyChecksum(string $archive, string $expected): void
    {
        $actual = hash_file('sha256', $archive);

        // hash_equals rather than !==: this is the only thing standing between
        // the registry's promise and arbitrary code on the server.
        if ($actual === false || ! hash_equals(strtolower($expected), strtolower($actual))) {
            throw new RuntimeException('The package checksum does not match the registry. Refusing to install.');
        }
    }
}
