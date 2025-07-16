<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\PostType;
use App\Models\Taxonomy;
use App\Models\TaxonomyTerm;

class ContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default post types
        $postType = PostType::create([
            'name' => 'post',
            'label' => 'Post',
            'plural_label' => 'Posts',
            'description' => 'Default blog posts',
            'has_taxonomies' => true,
            'has_featured_image' => true,
            'has_excerpt' => true,
            'has_comments' => true,
            'supports' => ['title', 'editor', 'thumbnail', 'excerpt', 'comments'],
            'taxonomies' => ['category', 'post_tag'],
            'slug' => 'posts',
            'is_public' => true,
            'is_hierarchical' => false,
            'menu_icon' => 'file-text',
            'menu_position' => 5,
        ]);

        $pageType = PostType::create([
            'name' => 'page',
            'label' => 'Page',
            'plural_label' => 'Pages',
            'description' => 'Static pages',
            'has_taxonomies' => false,
            'has_featured_image' => true,
            'has_excerpt' => false,
            'has_comments' => false,
            'supports' => ['title', 'editor', 'thumbnail'],
            'taxonomies' => [],
            'slug' => 'pages',
            'is_public' => true,
            'is_hierarchical' => true,
            'menu_icon' => 'file',
            'menu_position' => 6,
        ]);

        // Create default taxonomies
        $categoryTaxonomy = Taxonomy::create([
            'name' => 'category',
            'label' => 'Category',
            'plural_label' => 'Categories',
            'description' => 'Default post categories',
            'slug' => 'categories',
            'is_hierarchical' => true,
            'is_public' => true,
            'post_types' => ['post'],
            'show_in_menu' => true,
            'menu_icon' => 'folder',
            'menu_position' => 7,
        ]);

        $tagTaxonomy = Taxonomy::create([
            'name' => 'post_tag',
            'label' => 'Tag',
            'plural_label' => 'Tags',
            'description' => 'Default post tags',
            'slug' => 'tags',
            'is_hierarchical' => false,
            'is_public' => true,
            'post_types' => ['post'],
            'show_in_menu' => true,
            'menu_icon' => 'tag',
            'menu_position' => 8,
        ]);

        // Create some default taxonomy terms
        TaxonomyTerm::create([
            'taxonomy_id' => $categoryTaxonomy->id,
            'name' => 'Uncategorized',
            'slug' => 'uncategorized',
            'description' => 'Default category for posts',
        ]);

        TaxonomyTerm::create([
            'taxonomy_id' => $categoryTaxonomy->id,
            'name' => 'Technology',
            'slug' => 'technology',
            'description' => 'Technology related posts',
        ]);

        TaxonomyTerm::create([
            'taxonomy_id' => $categoryTaxonomy->id,
            'name' => 'Design',
            'slug' => 'design',
            'description' => 'Design related posts',
        ]);

        TaxonomyTerm::create([
            'taxonomy_id' => $tagTaxonomy->id,
            'name' => 'laravel',
            'slug' => 'laravel',
            'description' => 'Laravel framework',
        ]);

        TaxonomyTerm::create([
            'taxonomy_id' => $tagTaxonomy->id,
            'name' => 'react',
            'slug' => 'react',
            'description' => 'React framework',
        ]);
    }
}
