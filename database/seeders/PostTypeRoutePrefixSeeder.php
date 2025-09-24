<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PostType;

class PostTypeRoutePrefixSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Set route prefix for posts to 'posts'
        PostType::where('slug', 'post')->update(['route_prefix' => 'posts']);
        
        // Set route prefix for pages to null/empty (so they appear at root)
        PostType::where('slug', 'page')->update(['route_prefix' => null]);
        
        // You can add more post types here as needed
        // PostType::where('slug', 'info')->update(['route_prefix' => 'infos']);
        // PostType::where('slug', 'blog')->update(['route_prefix' => 'blog']);
    }
}
