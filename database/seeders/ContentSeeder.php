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
        // Create or update default post types (idempotent)
        $postType = PostType::updateOrCreate(
            ['name' => 'post'],
            [
                'label' => 'Post',
                'plural_label' => 'Posts',
                'description' => 'Default blog posts',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => true,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt', 'comments']),
                'taxonomies' => json_encode(['category', 'post_tag']),
                'slug' => 'posts',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'file-text',
                'menu_position' => 5,
            ]
        );

        // Intentionally do NOT seed the 'page' post type. Pages will be created on-demand
        // by the PagesController when an admin first uses the Pages section.

        // Add news post type
        $newsType = PostType::updateOrCreate(
            ['name' => 'news'],
            [
                'label' => 'News',
                'plural_label' => 'News',
                'description' => 'News and announcements',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
                'taxonomies' => ['category'],
                'slug' => 'news',
                'route_prefix' => 'news',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'newspaper',
                'menu_position' => 5.5,
            ]
        );

        // Create or update default taxonomies
        $categoryTaxonomy = Taxonomy::updateOrCreate(
            ['name' => 'category'],
            [
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
            ]
        );

        $tagTaxonomy = Taxonomy::updateOrCreate(
            ['name' => 'post_tag'],
            [
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
            ]
        );

        // Create some default taxonomy terms (idempotent)
        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'uncategorized'],
            [
                'name' => 'Uncategorized',
                'description' => 'Default category for posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'technology'],
            [
                'name' => 'Technology',
                'description' => 'Technology related posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'design'],
            [
                'name' => 'Design',
                'description' => 'Design related posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'laravel'],
            [
                'name' => 'laravel',
                'description' => 'Laravel framework',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'react'],
            [
                'name' => 'react',
                'description' => 'React framework',
            ]
        );
    }
}
