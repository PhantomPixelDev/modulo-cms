<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSitemapRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'included_post_type_ids' => 'nullable|array',
            'included_post_type_ids.*' => 'integer|exists:post_types,id',
            'include_taxonomies' => 'required|boolean',
            'enable_cache' => 'required|boolean',
            'cache_ttl' => 'required|integer|min:60|max:86400',
            'locale' => 'nullable|string',
            'custom_urls' => 'nullable|array',
            'custom_urls.*.loc' => 'nullable|string',
            'custom_urls.*.lastmod' => 'nullable|date',
            'custom_urls.*.changefreq' => 'nullable|string',
            'custom_urls.*.priority' => 'nullable|numeric',
        ];
    }
}
