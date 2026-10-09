<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Old seeders JSON-encoded values before Eloquent's array cast encoded them again.
        foreach (['post_types' => ['supports', 'taxonomies'], 'taxonomies' => ['post_types']] as $table => $columns) {
            DB::table($table)->orderBy('id')->chunkById(100, function ($rows) use ($table, $columns) {
                foreach ($rows as $row) {
                    $updates = [];
                    foreach ($columns as $column) {
                        $decoded = json_decode((string) $row->{$column}, true);
                        $array = is_string($decoded) ? json_decode($decoded, true) : null;
                        if (is_array($array)) {
                            $updates[$column] = json_encode($array, JSON_THROW_ON_ERROR);
                        }
                    }
                    if ($updates !== []) {
                        DB::table($table)->where('id', $row->id)->update($updates);
                    }
                }
            });
        }
    }

    public function down(): void
    {
        // Correct arrays remain compatible with previous versions; do not corrupt them again.
    }
};
