<?php

namespace Database\Factories;

use App\Models\Menu;
use Illuminate\Database\Eloquent\Factories\Factory;

class MenuFactory extends Factory
{
    protected $model = Menu::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word,
            'slug' => $this->faker->slug,
            'location' => $this->faker->randomElement(['header', 'footer', 'sidebar']),
            'description' => $this->faker->sentence,
        ];
    }
}
