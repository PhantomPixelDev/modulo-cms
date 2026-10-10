<?php

use App\Models\MediaBucket;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Earlier seeds placed library images in Spatie's default collection,
        // which the admin library correctly excludes. File paths use media IDs.
        DB::table('media')->where('model_type', MediaBucket::class)
            ->where('collection_name', 'default')->update(['collection_name' => 'library']);
    }

    public function down(): void
    {
        // Keep repaired library membership when rolling back; no files were moved.
    }
};
