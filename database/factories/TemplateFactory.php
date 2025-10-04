<?php

namespace Database\Factories;

use App\Models\Template;
use Illuminate\Database\Eloquent\Factories\Factory;

class TemplateFactory extends Factory
{
    protected $model = Template::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word,
            'type' => $this->faker->randomElement(['layout', 'partial', 'post', 'page', 'index', 'header', 'footer']),
            'content' => $this->faker->randomHtml(),
            'variables' => [],
            'is_default' => false,
            'is_active' => true,
            'created_by' => null,
        ];
    }
}
