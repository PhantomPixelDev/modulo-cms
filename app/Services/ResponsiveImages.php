<?php

namespace App\Services;

use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Smaller WebP copies of library images, for `srcset`.
 *
 * Posts store their featured image as a URL. For an image from the media
 * library (/storage/{media id}/file.jpg with the default path generator) the
 * 768px and 1600px WebP conversions are offered once they have been
 * generated; anything else (external URLs, older uploads not yet converted)
 * simply gets no srcset and the browser uses the original.
 */
class ResponsiveImages
{
    /** Conversion name => width in pixels, as registered on MediaBucket. */
    public const SIZES = ['medium' => 768, 'large' => 1600];

    /** @var array<int, Media|null> */
    protected array $media = [];

    /**
     * Load the media behind many URLs with one query (listing pages).
     *
     * @param  iterable<string|null>  $urls
     */
    public function preload(iterable $urls): void
    {
        $ids = [];
        foreach ($urls as $url) {
            $id = $this->mediaId($url);
            if ($id !== null && ! array_key_exists($id, $this->media)) {
                $ids[] = $id;
            }
        }

        if ($ids === []) {
            return;
        }

        $found = Media::query()->whereIn('id', array_unique($ids))->get()->keyBy('id');
        foreach ($ids as $id) {
            $this->media[$id] = $found->get($id);
        }
    }

    /** "…/conversions/x-medium.webp 768w, …/conversions/x-large.webp 1600w", or null. */
    public function srcset(?string $url): ?string
    {
        $media = $this->mediaFor($url);

        if ($media === null) {
            return null;
        }

        $sources = [];
        foreach (self::SIZES as $conversion => $width) {
            if ($media->hasGeneratedConversion($conversion)) {
                $sources[] = $media->getUrl($conversion).' '.$width.'w';
            }
        }

        return $sources === [] ? null : implode(', ', $sources);
    }

    public function alt(?string $url): ?string
    {
        $alt = $this->mediaFor($url)?->getCustomProperty('alt');

        return is_string($alt) && trim($alt) !== '' ? $alt : null;
    }

    protected function mediaFor(?string $url): ?Media
    {
        $id = $this->mediaId($url);

        if ($id === null) {
            return null;
        }

        if (! array_key_exists($id, $this->media)) {
            $this->preload([$url]);
        }

        return $this->media[$id] ?? null;
    }

    /** The library's own images only: /storage/{id}/{file} on this site. */
    protected function mediaId(?string $url): ?int
    {
        if (! is_string($url) || $url === '') {
            return null;
        }

        $path = parse_url($url, PHP_URL_PATH);
        $host = parse_url($url, PHP_URL_HOST);

        if ($host !== null && $host !== parse_url((string) config('app.url'), PHP_URL_HOST) && $host !== request()->getHost()) {
            return null;
        }

        return is_string($path) && preg_match('#^/storage/(\d+)/[^/]+$#', $path, $m) === 1 ? (int) $m[1] : null;
    }
}
