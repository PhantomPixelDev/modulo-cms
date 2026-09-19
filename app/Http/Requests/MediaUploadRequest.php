<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\Mime\MimeTypes;

use App\Models\SiteSetting;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Controller still authorizes via policies/roles
    }

    public function rules(): array
    {
        // Get max size from site settings (fallback to config, then 20MB)
        $maxMb = (int) SiteSetting::get('max_upload_size', config('uploads.max_mb', 20));

        $mimes = $this->allowedMimes();

        return [
            'file' => [
                'required',
                'file',
                'max:' . ($maxMb * 1024),
                'mimetypes:' . implode(',', $mimes),
                // The stored name keeps an extension, so it must match the allowlist too:
                // content sniffing alone lets polyglots like "shell.php" through.
                'extensions:' . implode(',', $this->allowedExtensions($mimes)),
            ],
            'folder_id' => 'nullable|integer|exists:media_buckets,id',
        ];
    }

    /**
     * @return array<int, string>
     */
    protected function allowedMimes(): array
    {
        // Allowed mimes from site settings, then config, then the default list
        $allowed = SiteSetting::get('allowed_mime_types');
        if (is_array($allowed) && $allowed !== []) {
            return array_values($allowed);
        }

        $configured = config('uploads.allowed_mimes');
        if (is_string($configured) && trim($configured) !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $configured))));
        }

        $allowSvg = (bool) SiteSetting::get('allow_svg_uploads', false);

        return [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            ...($allowSvg ? ['image/svg+xml'] : []),
            'application/pdf', 'application/zip',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg',
        ];
    }

    /**
     * @param  array<int, string>  $mimes
     * @return array<int, string>
     */
    protected function allowedExtensions(array $mimes): array
    {
        $blocked = config('uploads.blocked_extensions', []);
        $mimeTypes = MimeTypes::getDefault();

        $extensions = collect($mimes)
            ->flatMap(fn (string $mime) => $mimeTypes->getExtensions($mime))
            ->map(fn (string $ext) => strtolower($ext))
            ->reject(fn (string $ext) => in_array($ext, $blocked, true))
            ->unique()
            ->values()
            ->all();

        // Keep the rule valid even if nothing maps; an impossible extension rejects everything.
        return $extensions ?: ['invalid-extension'];
    }
}
