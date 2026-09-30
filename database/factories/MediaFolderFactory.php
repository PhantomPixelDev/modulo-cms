<?php

namespace Database\Factories;

use App\Models\MediaBucket;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaFolderFactory extends Factory
{
    protected $model = MediaBucket::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word,
            'parent_id' => null,
        ];
    }
}
