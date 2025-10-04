<?php

namespace Database\Factories;

use App\Models\MediaFolder;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaFolderFactory extends Factory
{
    protected $model = MediaFolder::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word,
            'parent_id' => null,
        ];
    }
}
