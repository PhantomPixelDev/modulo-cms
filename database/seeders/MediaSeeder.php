<?php

namespace Database\Seeders;

use App\Models\MediaBucket;
use Illuminate\Database\Seeder;

/** Register one real local image rather than inventing corrupt media files. */
class MediaSeeder extends Seeder
{
    public function run(): void
    {
        $bucket = MediaBucket::firstOrCreate(['name' => 'Demo']);
        if (! $bucket->media()->where('file_name', 'demo-logo.png')->exists()) {
            $bucket->addMedia(public_path('apple-touch-icon.png'))->preservingOriginal()
                ->usingName('Modulo demo logo')->usingFileName('demo-logo.png')->toMediaCollection('library', 'public');
        }
    }
}
