<?php

namespace Database\Factories;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\Factory;

class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word . '.' . $this->faker->fileExtension,
            'file_name' => $this->faker->word,
            'mime_type' => 'image/jpeg',
            'path' => 'media/' . $this->faker->word,
            'disk' => 'public',
            'file_hash' => $this->faker->sha256,
            'collection' => 'default',
            'size' => $this->faker->numberBetween(1000, 1000000),
        ];
    }
}
