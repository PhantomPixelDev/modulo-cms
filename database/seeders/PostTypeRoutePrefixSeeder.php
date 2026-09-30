<?php

namespace Database\Seeders;

use App\Models\PostType;
use Illuminate\Database\Seeder;

class PostTypeRoutePrefixSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Fill in defaults only where nothing was set: an administrator may
        // have customized these, and this seeder runs on every upgrade.
        PostType::where('slug', 'post')->whereNull('route_prefix')->update(['route_prefix' => 'posts']);

        // Pages live at the site root; nothing to do when already null.
        PostType::where('slug', 'page')->whereNull('route_prefix')->update(['route_prefix' => null]);
    }
}
