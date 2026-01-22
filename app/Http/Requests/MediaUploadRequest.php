<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

use App\Models\SiteSetting;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Controller still authorizes via policies/roles
    }

    public function rules(): array
    {
        // Get max size from site settings (fallback to env, then 20MB)
        $maxMb = SiteSetting::get('max_upload_size', (int) env('MAX_UPLOAD_MB', 20));
        
        // Get allowed mimes from site settings (fallback to env, then default list)
        $allowed = SiteSetting::get('allowed_mime_types');
        if (is_array($allowed)) {
            $mimes = implode(',', $allowed);
        } else {
            $mimes = env('ALLOWED_UPLOAD_MIMES');
        }

        if (!$mimes) {
            $allowSvg = (bool) SiteSetting::get('allow_svg_uploads', false);
            $mimes = implode(',', [
                'image/jpeg','image/png','image/gif','image/webp',
                ...($allowSvg ? ['image/svg+xml'] : []),
                'application/pdf','application/zip',
                'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'video/mp4','video/webm','audio/mpeg','audio/ogg',
            ]);
        }

        return [
            'file' => 'required|file|max:' . ($maxMb * 1024) . '|mimetypes:' . $mimes,
            'folder_id' => 'nullable|integer|exists:media_buckets,id',
        ];
    }
}
