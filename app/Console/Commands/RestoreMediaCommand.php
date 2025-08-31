<?php

namespace App\Console\Commands;

use App\Models\Post;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class RestoreMediaCommand extends Command
{
    protected $signature = 'media:restore {--dry-run : Show what would be restored without actually doing it}';
    protected $description = 'Restore missing media files referenced in the database';

    public function handle()
    {
        $this->info('Starting media file restoration...');
        
        $dryRun = $this->option('dry-run');
        $placeholderPath = public_path('apple-touch-icon.png');
        $restoredCount = 0;
        $missingFiles = [];

        // Check if placeholder exists
        if (!File::exists($placeholderPath)) {
            $this->error('Placeholder image not found at: ' . $placeholderPath);
            return 1;
        }

        // Get all featured images from posts
        $featuredImages = Post::whereNotNull('featured_image')
            ->pluck('featured_image')
            ->unique()
            ->filter();

        foreach ($featuredImages as $imageUrl) {
            if (preg_match('/\/storage\/(.+)$/', $imageUrl, $matches)) {
                $relativePath = $matches[1];
                $fullPath = storage_path('app/public/' . $relativePath);
                
                if (!File::exists($fullPath)) {
                    $missingFiles[] = $relativePath;
                    
                    if (!$dryRun) {
                        // Create directory if it doesn't exist
                        $directory = dirname($fullPath);
                        if (!File::exists($directory)) {
                            File::makeDirectory($directory, 0755, true);
                            $this->info("Created directory: {$directory}");
                        }
                        
                        // Copy placeholder image
                        File::copy($placeholderPath, $fullPath);
                        File::chmod($fullPath, 0644);
                        $restoredCount++;
                        $this->info("Restored: {$relativePath}");
                    } else {
                        $this->warn("Would restore: {$relativePath}");
                    }
                }
            }
        }

        // Check meta_data for additional media references
        $postsWithMeta = Post::whereNotNull('meta_data')->get();
        
        foreach ($postsWithMeta as $post) {
            $metaData = json_decode($post->meta_data, true);
            if (is_array($metaData)) {
                $this->checkMetaDataForMedia($metaData, $missingFiles, $placeholderPath, $dryRun, $restoredCount);
            }
        }

        if ($dryRun) {
            $this->info("Dry run completed. Found {$missingFiles->count()} missing files.");
        } else {
            $this->info("Media restoration completed! Restored {$restoredCount} files.");
        }

        return 0;
    }

    private function checkMetaDataForMedia(array $data, array &$missingFiles, string $placeholderPath, bool $dryRun, int &$restoredCount)
    {
        array_walk_recursive($data, function ($value) use (&$missingFiles, $placeholderPath, $dryRun, &$restoredCount) {
            if (is_string($value) && preg_match('/\/storage\/(.+\.(jpg|jpeg|png|gif|webp|svg))$/i', $value, $matches)) {
                $relativePath = $matches[1];
                $fullPath = storage_path('app/public/' . $relativePath);
                
                if (!File::exists($fullPath) && !in_array($relativePath, $missingFiles)) {
                    $missingFiles[] = $relativePath;
                    
                    if (!$dryRun) {
                        $directory = dirname($fullPath);
                        if (!File::exists($directory)) {
                            File::makeDirectory($directory, 0755, true);
                        }
                        
                        File::copy($placeholderPath, $fullPath);
                        File::chmod($fullPath, 0644);
                        $restoredCount++;
                        $this->info("Restored from meta: {$relativePath}");
                    } else {
                        $this->warn("Would restore from meta: {$relativePath}");
                    }
                }
            }
        });
    }
}
