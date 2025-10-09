<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MediaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding media files...');

        // Ensure storage directories exist
        $publicStoragePath = storage_path('app/public');
        if (!File::exists($publicStoragePath)) {
            File::makeDirectory($publicStoragePath, 0755, true);
        }

        // Create sample media directories and files
        $sampleDirectories = [
            '11' => [
                '3d-cube.png',
                'abstract-art.jpg',
                'city-skyline.jpg',
                'nature-landscape.jpg',
                'product-mockup.png'
            ],
            '14' => [
                'hackers_2-wallpaper-1280x1024.jpg',
                'technology-bg.jpg',
                'circuit-board.jpg',
                'data-center.jpg',
                'network-diagram.png'
            ],
            '15' => [
                'team-meeting.jpg',
                'office-workspace.jpg',
                'business-presentation.jpg',
                'handshake-deal.jpg',
                'corporate-building.jpg'
            ],
            '16' => [
                'food-photography.jpg',
                'restaurant-interior.jpg',
                'chef-cooking.jpg',
                'dining-table.jpg',
                'fresh-ingredients.jpg'
            ],
            '17' => [
                'travel-mountains.jpg',
                'beach-sunset.jpg',
                'city-tour.jpg',
                'cultural-landmark.jpg',
                'adventure-gear.jpg'
            ],
            '18' => [
                'fitness-workout.jpg',
                'yoga-practice.jpg',
                'healthy-meal.jpg',
                'medical-consultation.jpg',
                'wellness-spa.jpg'
            ],
            '19' => [
                'lifestyle-coffee.jpg',
                'home-interior.jpg',
                'fashion-accessories.jpg',
                'entertainment-setup.jpg',
                'hobby-collection.jpg'
            ],
        ];

        $placeholderPath = public_path('apple-touch-icon.png');

        if (File::exists($placeholderPath)) {
            foreach ($sampleDirectories as $dir => $files) {
                $dirPath = $publicStoragePath . '/' . $dir;

                if (!File::exists($dirPath)) {
                    File::makeDirectory($dirPath, 0755, true);
                    $this->command->info("Created directory: storage/app/public/{$dir}");
                }

                foreach ($files as $filename) {
                    $filePath = $dirPath . '/' . $filename;

                    if (!File::exists($filePath)) {
                        File::copy($placeholderPath, $filePath);
                        File::chmod($filePath, 0644);
                        $this->command->info("Created media file: {$dir}/{$filename}");
                    }
                }
            }
        } else {
            $this->command->warn('Placeholder image not found, skipping media file creation');
        }

        // Create some additional sample files with different extensions
        $additionalFiles = [
            'documents' => [
                'project-proposal.pdf',
                'meeting-notes.docx',
                'presentation.pptx',
                'spreadsheet.xlsx',
                'technical-specs.pdf'
            ],
            'audio' => [
                'podcast-episode.mp3',
                'background-music.wav',
                'interview-recording.mp3',
                'sound-effects.zip'
            ],
            'video' => [
                'product-demo.mp4',
                'tutorial-video.webm',
                'company-presentation.mp4',
                'webinar-recording.mov'
            ]
        ];

        foreach ($additionalFiles as $type => $files) {
            $typeDir = $publicStoragePath . '/' . $type;
            if (!File::exists($typeDir)) {
                File::makeDirectory($typeDir, 0755, true);
            }

            foreach ($files as $filename) {
                $filePath = $typeDir . '/' . $filename;
                if (!File::exists($filePath)) {
                    // Create empty files for different types
                    File::put($filePath, 'Sample ' . $type . ' file content');
                    File::chmod($filePath, 0644);
                    $this->command->info("Created {$type} file: {$type}/{$filename}");
                }
            }
        }

        $this->command->info('Media seeding completed!');
    }
}
