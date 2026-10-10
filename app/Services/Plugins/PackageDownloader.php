<?php

namespace App\Services\Plugins;

use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;
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
    public function download(string $url, string $destination, ?int $timeout = null, ?int $maxBytes = null): void
    {
        $maxBytes ??= (int) config('plugins.max_download_bytes', 268435456);
        try {
            for ($redirects = 0; $redirects <= 5; $redirects++) {
                $host = $this->validateUrl($url);
                $records = dns_get_record($host, DNS_A | DNS_AAAA);
                $addresses = array_values(array_unique(array_filter(array_map(fn ($record) => $record['ip'] ?? $record['ipv6'] ?? null, $records ?: []))));
                if ($addresses === [] || array_any($addresses, fn ($ip) => ! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE))) {
                    throw new RuntimeException('Package host does not resolve exclusively to public addresses.');
                }
                $resolved = implode(',', array_map(fn ($ip) => str_contains($ip, ':') ? '['.$ip.']' : $ip, $addresses));
                $response = Http::timeout($timeout ?? (int) config('plugins.timeout'))
                    ->withOptions([
                        'sink' => $destination,
                        'allow_redirects' => false,
                        // Pin the checked DNS answer for this request, preventing
                        // rebinding between validation and connection.
                        'curl' => [CURLOPT_RESOLVE => ["{$host}:443:{$resolved}"]],
                        'on_headers' => function ($response) use ($maxBytes) {
                            if ((int) $response->getHeaderLine('Content-Length') > $maxBytes) {
                                throw new RuntimeException('Package exceeds the download limit.');
                            }
                        },
                        'progress' => function ($total, $downloaded) use ($maxBytes) {
                            if ($downloaded > $maxBytes) {
                                throw new RuntimeException('Package exceeds the download limit.');
                            }
                        },
                    ])->get($url);
                if ($response->redirect()) {
                    $location = $response->header('Location');
                    if ($location === '' || $redirects === 5) {
                        throw new RuntimeException('Invalid or excessive package redirects.');
                    }
                    $url = (string) UriResolver::resolve(new Uri($url), new Uri($location));

                    continue;
                }
                if (! $response->successful()) {
                    throw new RuntimeException('Downloading the package returned '.$response->status().'.');
                }
                if (! File::exists($destination) || File::size($destination) === 0 || File::size($destination) > $maxBytes) {
                    throw new RuntimeException('The downloaded package is empty or exceeds the download limit.');
                }

                return;
            }
        } catch (Throwable $e) {
            File::delete($destination);
            throw new RuntimeException('Could not download the package: '.$e->getMessage());
        }
    }

    public function validateUrl(string $url): string
    {
        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');
        if (($parts['scheme'] ?? '') !== 'https' || isset($parts['user']) || isset($parts['pass'])
            || ($parts['port'] ?? 443) !== 443 || $host === '' || filter_var($host, FILTER_VALIDATE_IP)
            || (! config('plugins.allow_url_install') && ! in_array($host, config('plugins.allowed_hosts', []), true))) {
            throw new RuntimeException('Package URL is not an allowed HTTPS download.');
        }

        return $host;
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
