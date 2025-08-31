<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PostRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is typically handled by route middleware/permissions
        return true;
    }

    public function rules(): array
    {
        // When updating, route-model binding provides 'post'
        $postId = optional($this->route('post'))->id;

        return [
            'post_type_id' => ['required','integer','exists:post_types,id'],
            'author_id' => ['required','integer','exists:users,id'],

            'title' => ['required','string','max:255'],
            'slug' => [
                'required','string','max:255',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('posts','slug')->ignore($postId),
            ],

            'excerpt' => ['nullable','string'],
            'content' => ['required','string'],
            'featured_image' => ['nullable','string','max:2048'],

            'status' => ['required', Rule::in(['draft','published','private','archived'])],
            'published_at' => ['nullable','date'],

            'parent_id' => ['nullable','integer','exists:posts,id'],
            'menu_order' => ['nullable','integer','between:-2147483648,2147483647'],

            'meta_title' => ['nullable','string','max:255'],
            'meta_description' => ['nullable','string'],
            'meta_data' => ['nullable','array'],
            'view_count' => ['nullable','integer','min:0'],

            // Selected taxonomy terms (if provided)
            'selected_terms' => ['nullable','array'],
            'selected_terms.*' => ['integer','exists:taxonomy_terms,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'The slug may only contain lowercase letters, numbers, and hyphens.',
        ];
    }
}
