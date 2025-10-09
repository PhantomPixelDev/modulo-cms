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
                'plural_label' => 'Blog Posts',
                'description' => 'Browse all our latest blog posts and articles',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => true,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt', 'comments']),
                'taxonomies' => json_encode(['category', 'post_tag']),
                'slug' => 'post',
                'route_prefix' => 'posts',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'file-text',
                'menu_position' => 5,
            ]
        );

        // Intentionally do NOT seed the 'page' post type. Pages will be created on-demand
        // by the PagesController when an admin first uses the Pages section.

        // Add more post types
        $productType = PostType::updateOrCreate(
            ['name' => 'product'],
            [
                'label' => 'Product',
                'plural_label' => 'Products',
                'description' => 'Products and services offered by the company',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode(['category', 'post_tag']),
                'slug' => 'product',
                'route_prefix' => 'products',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'package',
                'menu_position' => 6,
            ]
        );

        $portfolioType = PostType::updateOrCreate(
            ['name' => 'portfolio'],
            [
                'label' => 'Portfolio Item',
                'plural_label' => 'Portfolio',
                'description' => 'Showcase portfolio items and projects',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode(['category', 'post_tag']),
                'slug' => 'portfolio',
                'route_prefix' => 'portfolio',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'briefcase',
                'menu_position' => 7,
            ]
        );

        $testimonialType = PostType::updateOrCreate(
            ['name' => 'testimonial'],
            [
                'label' => 'Testimonial',
                'plural_label' => 'Testimonials',
                'description' => 'Customer testimonials and reviews',
                'has_taxonomies' => false,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode([]),
                'slug' => 'testimonial',
                'route_prefix' => 'testimonials',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'star',
                'menu_position' => 8,
            ]
        );

        $eventType = PostType::updateOrCreate(
            ['name' => 'event'],
            [
                'label' => 'Event',
                'plural_label' => 'Events',
                'description' => 'Upcoming events and announcements',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode(['category', 'post_tag']),
                'slug' => 'event',
                'route_prefix' => 'events',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'calendar',
                'menu_position' => 9,
            ]
        );

        $faqType = PostType::updateOrCreate(
            ['name' => 'faq'],
            [
                'label' => 'FAQ',
                'plural_label' => 'FAQs',
                'description' => 'Frequently asked questions',
                'has_taxonomies' => false,
                'has_featured_image' => false,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'excerpt']),
                'taxonomies' => json_encode([]),
                'slug' => 'faq',
                'route_prefix' => 'faqs',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'help-circle',
                'menu_position' => 10,
            ]
        );

        $caseStudyType = PostType::updateOrCreate(
            ['name' => 'case-study'],
            [
                'label' => 'Case Study',
                'plural_label' => 'Case Studies',
                'description' => 'Detailed case studies and success stories',
                'has_taxonomies' => true,
                'has_featured_image' => true,
                'has_excerpt' => true,
                'has_comments' => false,
                'supports' => json_encode(['title', 'editor', 'thumbnail', 'excerpt']),
                'taxonomies' => json_encode(['category', 'post_tag']),
                'slug' => 'case-study',
                'route_prefix' => 'case-studies',
                'is_public' => true,
                'is_hierarchical' => false,
                'menu_icon' => 'trending-up',
                'menu_position' => 11,
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
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'business'],
            [
                'name' => 'Business',
                'description' => 'Business and entrepreneurship posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'lifestyle'],
            [
                'name' => 'Lifestyle',
                'description' => 'Lifestyle and personal posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'travel'],
            [
                'name' => 'Travel',
                'description' => 'Travel and adventure posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'food'],
            [
                'name' => 'Food',
                'description' => 'Food and cooking posts',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'health'],
            [
                'name' => 'Health',
                'description' => 'Health and wellness posts',
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

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'php'],
            [
                'name' => 'php',
                'description' => 'PHP programming language',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'javascript'],
            [
                'name' => 'javascript',
                'description' => 'JavaScript programming language',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'typescript'],
            [
                'name' => 'typescript',
                'description' => 'TypeScript programming language',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'tailwindcss'],
            [
                'name' => 'tailwindcss',
                'description' => 'Tailwind CSS framework',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'docker'],
            [
                'name' => 'docker',
                'description' => 'Docker containerization',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'aws'],
            [
                'name' => 'aws',
                'description' => 'Amazon Web Services',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'api'],
            [
                'name' => 'api',
                'description' => 'API development',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'database'],
            [
                'name' => 'database',
                'description' => 'Database topics',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'security'],
            [
                'name' => 'security',
                'description' => 'Security topics',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'performance'],
            [
                'name' => 'performance',
                'description' => 'Performance optimization',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'testing'],
            [
                'name' => 'testing',
                'description' => 'Testing methodologies',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'deployment'],
            [
                'name' => 'deployment',
                'description' => 'Deployment strategies',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'tutorial'],
            [
                'name' => 'tutorial',
                'description' => 'Tutorial content',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'beginner'],
            [
                'name' => 'beginner',
                'description' => 'Beginner-friendly content',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'advanced'],
            [
                'name' => 'advanced',
                'description' => 'Advanced topics',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'tips'],
            [
                'name' => 'tips',
                'description' => 'Tips and tricks',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'news'],
            [
                'name' => 'News',
                'description' => 'Latest news and announcements',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'resources'],
            [
                'name' => 'Resources',
                'description' => 'Helpful resources and tools',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'guides'],
            [
                'name' => 'Guides',
                'description' => 'Step-by-step guides and tutorials',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'case-studies'],
            [
                'name' => 'Case Studies',
                'description' => 'Real-world case studies and success stories',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'events'],
            [
                'name' => 'Events',
                'description' => 'Upcoming events and webinars',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'products'],
            [
                'name' => 'Products',
                'description' => 'Product announcements and features',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => 'portfolio'],
            [
                'name' => 'Portfolio',
                'description' => 'Portfolio and project showcases',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'web-development'],
            [
                'name' => 'web-development',
                'description' => 'Web development topics',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'frontend'],
            [
                'name' => 'frontend',
                'description' => 'Frontend development',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'backend'],
            [
                'name' => 'backend',
                'description' => 'Backend development',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'full-stack'],
            [
                'name' => 'full-stack',
                'description' => 'Full-stack development',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'devops'],
            [
                'name' => 'devops',
                'description' => 'DevOps and deployment',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'ux-ui'],
            [
                'name' => 'ux-ui',
                'description' => 'User experience and interface design',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'marketing'],
            [
                'name' => 'marketing',
                'description' => 'Digital marketing topics',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'seo'],
            [
                'name' => 'seo',
                'description' => 'Search engine optimization',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'analytics'],
            [
                'name' => 'analytics',
                'description' => 'Data analytics and insights',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'cms'],
            [
                'name' => 'cms',
                'description' => 'Content management systems',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'ecommerce'],
            [
                'name' => 'ecommerce',
                'description' => 'E-commerce solutions',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'saas'],
            [
                'name' => 'saas',
                'description' => 'Software as a Service',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'api-integration'],
            [
                'name' => 'api-integration',
                'description' => 'API integration and development',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'cloud-computing'],
            [
                'name' => 'cloud-computing',
                'description' => 'Cloud computing and services',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'mobile-development'],
            [
                'name' => 'mobile-development',
                'description' => 'Mobile app development',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'data-visualization'],
            [
                'name' => 'data-visualization',
                'description' => 'Data visualization techniques',
            ]
        );

        TaxonomyTerm::updateOrCreate(
            ['taxonomy_id' => $tagTaxonomy->id, 'slug' => 'machine-learning'],
            [
                'name' => 'machine-learning',
                'description' => 'Machine learning and AI',
            ]
        );
    }
}
