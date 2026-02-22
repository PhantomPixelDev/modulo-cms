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
        // Create only essential post types
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

        // Create only essential taxonomies
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

        $this->translateTaxonomy($categoryTaxonomy, [
            'es' => [
                'label' => 'Categoría',
                'plural_label' => 'Categorías',
                'description' => 'Categorías predeterminadas para las publicaciones',
            ],
        ]);

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

        $this->translateTaxonomy($tagTaxonomy, [
            'es' => [
                'label' => 'Etiqueta',
                'plural_label' => 'Etiquetas',
                'description' => 'Etiquetas predeterminadas para las publicaciones',
            ],
        ]);

        // Create only essential category terms
        $essentialCategories = [
            ['slug' => 'uncategorized', 'name' => 'Uncategorized', 'description' => 'Default category for posts'],
            ['slug' => 'technology', 'name' => 'Technology', 'description' => 'Technology related posts'],
            ['slug' => 'design', 'name' => 'Design', 'description' => 'Design related posts'],
            ['slug' => 'business', 'name' => 'Business', 'description' => 'Business and entrepreneurship posts'],
        ];

        foreach ($essentialCategories as $category) {
            TaxonomyTerm::updateOrCreate(
                ['taxonomy_id' => $categoryTaxonomy->id, 'slug' => $category['slug']],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                ]
            );
        }

        // Create only essential tag terms
        $essentialTags = [
            ['slug' => 'laravel', 'name' => 'laravel', 'description' => 'Laravel framework'],
            ['slug' => 'react', 'name' => 'react', 'description' => 'React framework'],
            ['slug' => 'php', 'name' => 'php', 'description' => 'PHP programming language'],
            ['slug' => 'javascript', 'name' => 'javascript', 'description' => 'JavaScript programming language'],
            ['slug' => 'web-development', 'name' => 'web-development', 'description' => 'Web development topics'],
        ];

        foreach ($essentialTags as $tag) {
            TaxonomyTerm::updateOrCreate(
                ['taxonomy_id' => $tagTaxonomy->id, 'slug' => $tag['slug']],
                [
                    'name' => $tag['name'],
                    'description' => $tag['description'],
                ]
            );
        }

        // Apply translations for essential terms
        $this->applyTermTranslations($categoryTaxonomy, [
            'technology' => [
                'es' => [
                    'name' => 'Tecnología',
                    'slug' => 'tecnologia',
                    'description' => 'Publicaciones relacionadas con tecnología',
                ],
            ],
            'design' => [
                'es' => [
                    'name' => 'Diseño',
                    'slug' => 'diseno',
                    'description' => 'Publicaciones relacionadas con diseño',
                ],
            ],
            'business' => [
                'es' => [
                    'name' => 'Negocios',
                    'slug' => 'negocios',
                    'description' => 'Artículos sobre negocios y emprendimiento',
                ],
            ],
        ]);

        $this->applyTermTranslations($tagTaxonomy, [
            'laravel' => [
                'es' => [
                    'name' => 'Laravel',
                    'slug' => 'laravel',
                    'description' => 'Framework Laravel',
                ],
            ],
            'react' => [
                'es' => [
                    'name' => 'React',
                    'slug' => 'react',
                    'description' => 'Framework React',
                ],
            ],
            'php' => [
                'es' => [
                    'name' => 'PHP',
                    'slug' => 'php',
                    'description' => 'Lenguaje de programación PHP',
                ],
            ],
            'javascript' => [
                'es' => [
                    'name' => 'JavaScript',
                    'slug' => 'javascript',
                    'description' => 'Lenguaje de programación JavaScript',
                ],
            ],
            'web-development' => [
                'es' => [
                    'name' => 'Desarrollo Web',
                    'slug' => 'desarrollo-web',
                    'description' => 'Temas de desarrollo web',
                ],
            ],
        ]);
    }

    private function translateTaxonomy(Taxonomy $taxonomy, array $translations): void
    {
        foreach ($translations as $locale => $payload) {
            if (empty($payload)) {
                continue;
            }

            $taxonomy->setTranslation($locale, $payload);
        }
    }

    private function translateTerm(?TaxonomyTerm $term, array $translations): void
    {
        if (!$term) {
            return;
        }

        foreach ($translations as $locale => $payload) {
            if (empty($payload)) {
                continue;
            }

            $term->setTranslation($locale, $payload);
        }
    }

    private function applyTermTranslations(Taxonomy $taxonomy, array $translations): void
    {
        foreach ($translations as $slug => $payload) {
            $term = $taxonomy->terms()->where('slug', $slug)->first();
            $this->translateTerm($term, $payload);
        }
    }
}
