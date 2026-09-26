<?php

use App\Models\MediaBucket;
use App\Models\Post;
use App\Models\PostType;
use App\Presenters\PostPresenter;
use App\Services\ResponsiveImages;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

beforeEach(function () {
    Storage::fake('public');
});

function libraryImage(int $width = 2000): Media
{
    $bucket = MediaBucket::create(['name' => 'Uploads']);

    return $bucket->addMedia(UploadedFile::fake()->image('photo.jpg', $width, (int) ($width * 0.6)))->toMediaCollection();
}

it('offers the WebP sizes of a library image as a srcset', function () {
    $media = libraryImage();
    $url = $media->getUrl();

    $srcset = app(ResponsiveImages::class)->srcset($url);

    expect($media->fresh()->hasGeneratedConversion('medium'))->toBeTrue()
        ->and($srcset)->toContain('-medium.webp 768w')
        ->and($srcset)->toContain('-large.webp 1600w');

    [$width] = getimagesize(Storage::disk('public')->path($media->fresh()->getPathRelativeToRoot('large')));
    expect($width)->toBe(1600);
});

it('never makes a copy larger than the original', function () {
    $media = libraryImage(500);

    [$width] = getimagesize(Storage::disk('public')->path($media->fresh()->getPathRelativeToRoot('large')));

    expect($width)->toBe(500);
});

it('leaves images that are not from the library alone', function () {
    $images = app(ResponsiveImages::class);

    expect($images->srcset('https://cdn.example.com/storage/1/photo.jpg'))->toBeNull()
        ->and($images->srcset('/images/logo.png'))->toBeNull()
        ->and($images->srcset('/storage/999999/missing.jpg'))->toBeNull()
        ->and($images->srcset(null))->toBeNull();
});

it('gives posts a srcset and alt text, and lazy-loads images in the body', function () {
    $media = libraryImage();
    $media->setCustomProperty('alt', 'A calm lake at dawn')->save();
    $type = PostType::factory()->create();
    $post = Post::factory()->published()->create([
        'post_type_id' => $type->id,
        'featured_image' => $media->getUrl(),
        'content' => '<p>Look:</p><img src="/a.jpg" alt="a"><img src="/b.jpg" alt="b" loading="eager">',
    ]);

    $presented = app(PostPresenter::class)->presentPost($post);

    expect($presented['featured_image_srcset'])->toContain('768w')
        ->and($presented['featured_image_alt'])->toBe('A calm lake at dawn')
        ->and($presented['content'])->toContain('<img loading="lazy" decoding="async" src="/a.jpg"')
        ->and($presented['content'])->toContain('loading="eager"')
        ->and(substr_count($presented['content'], 'loading="lazy"'))->toBe(1);
});
