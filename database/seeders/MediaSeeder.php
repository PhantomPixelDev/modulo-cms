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
            '11' => ['3d-cube.png'],
            '14' => ['hackers_2-wallpaper-1280x1024.jpg'],
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
    }
}
