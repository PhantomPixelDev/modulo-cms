<?php

namespace Database\Factories;

use App\Models\PostType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PostType>
 */
class PostTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();
        
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'label' => ucfirst($name),
            'plural_label' => ucfirst($name) . 's',
            'description' => fake()->sentence(),
            'route_prefix' => Str::slug($name),
            'single_template_id' => null,
            'archive_template_id' => null,
            'has_taxonomies' => fake()->boolean(),
            'has_featured_image' => fake()->boolean(),
            'has_excerpt' => fake()->boolean(),
            'has_comments' => fake()->boolean(),
            'supports' => ['title', 'editor'],
            'taxonomies' => [],
            'is_public' => true,
            'is_hierarchical' => false,
            'menu_icon' => 'document',
            'menu_position' => fake()->numberBetween(1, 100),
        ];
    }
}
