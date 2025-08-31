<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Controller still authorizes via policies/roles
    }

    public function rules(): array
    {
        $maxMb = (int) env('MAX_UPLOAD_MB', 20);
        // Allow overriding mimes via env; fallback to a safe default list
        $allowed = env('ALLOWED_UPLOAD_MIMES');
        $defaultMimes = implode(',', [
            'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
            'application/pdf','application/zip',
            'application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'video/mp4','video/webm','audio/mpeg','audio/ogg',
        ]);
        $mimes = $allowed ? $allowed : $defaultMimes;

        return [
            'file' => 'required|file|max:' . ($maxMb * 1024) . '|mimetypes:' . $mimes,
            'folder_id' => 'nullable|integer|exists:media_buckets,id',
        ];
    }
}
