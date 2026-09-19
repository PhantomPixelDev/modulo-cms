<?php

use App\Models\Post;

it('dry-runs over posts that have meta data', function () {
    Post::factory()->create([
        'featured_image' => '/storage/missing/cover.png',
        'meta_data' => ['gallery' => ['/storage/missing/one.jpg']],
    ]);

    $this->artisan('media:restore', ['--dry-run' => true])
        ->expectsOutputToContain('Found 2 missing files')
        ->assertSuccessful();
});
