#!/bin/bash

# Media Restoration Script for Modulo CMS
# This script ensures all media files referenced in the database exist

set -e

echo "Starting media file restoration..."

# Define paths
STORAGE_PATH="/var/www/html/storage/app/public"
PLACEHOLDER_IMAGE="/var/www/html/public/apple-touch-icon.png"

# Function to create placeholder image if missing
create_placeholder() {
    local file_path="$1"
    local dir_path=$(dirname "$file_path")
    
    echo "Creating directory: $dir_path"
    mkdir -p "$dir_path"
    
    if [ ! -f "$file_path" ]; then
        echo "Creating placeholder: $file_path"
        cp "$PLACEHOLDER_IMAGE" "$file_path"
        chmod 644 "$file_path"
        chown www-data:www-data "$file_path" 2>/dev/null || true
    fi
}

# Get all media files from database and create missing ones
php artisan tinker --execute="
\App\Models\Post::whereNotNull('featured_image')
    ->get(['featured_image'])
    ->pluck('featured_image')
    ->unique()
    ->each(function(\$url) {
        if (preg_match('/\/storage\/(.+)$/', \$url, \$matches)) {
            echo \$matches[1] . PHP_EOL;
        }
    });
" | while read -r media_path; do
    if [ -n "$media_path" ]; then
        full_path="$STORAGE_PATH/$media_path"
        create_placeholder "$full_path"
    fi
done

# Also check for any other media references in meta_data
php artisan tinker --execute="
\App\Models\Post::whereNotNull('meta_data')
    ->get(['meta_data'])
    ->each(function(\$post) {
        \$meta = json_decode(\$post->meta_data, true);
        if (is_array(\$meta)) {
            array_walk_recursive(\$meta, function(\$value) {
                if (is_string(\$value) && preg_match('/\/storage\/(.+\.(jpg|jpeg|png|gif|webp|svg))$/i', \$value, \$matches)) {
                    echo \$matches[1] . PHP_EOL;
                }
            });
        }
    });
" | while read -r media_path; do
    if [ -n "$media_path" ]; then
        full_path="$STORAGE_PATH/$media_path"
        create_placeholder "$full_path"
    fi
done

echo "Media file restoration completed!"
