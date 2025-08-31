<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PostTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $postType = $this->route('postType') ?? $this->route('post_type') ?? $this->route('posttype');
        $id = is_object($postType) ? ($postType->id ?? null) : null;

        return [
            'name' => [
                'required','string','max:100',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('post_types','name')->ignore($id),
            ],
            'label' => ['required','string','max:100'],
            'plural_label' => ['required','string','max:100'],
            'description' => ['nullable','string'],

            'slug' => [
                'required','string','max:100',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('post_types','slug')->ignore($id),
            ],

            // route_prefix is optional, but cannot be just '/'
            'route_prefix' => [
                'nullable','string','max:100',
                'regex:/^[a-z0-9-\/]*$/',
                function ($attr, $value, $fail) {
                    if ($value === '/') {
                        $fail('The route prefix may not be the root "/".');
                    }
                },
            ],

            'has_taxonomies' => ['boolean'],
            'has_featured_image' => ['boolean'],
            'has_excerpt' => ['boolean'],
            'has_comments' => ['boolean'],

            'supports' => ['nullable','array'],
            'supports.*' => ['string','in:title,editor,thumbnail,excerpt,comments'],

            'taxonomies' => ['nullable','array'],
            'taxonomies.*' => ['string','max:100'],

            'is_public' => ['boolean'],
            'is_hierarchical' => ['boolean'],
            'menu_icon' => ['nullable','string','max:191'],
            'menu_position' => ['nullable','integer','between:-2147483648,2147483647'],

            'single_template_id' => ['nullable','integer','exists:templates,id'],
            'archive_template_id' => ['nullable','integer','exists:templates,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'The name may only contain lowercase letters, numbers, and underscores.',
            'slug.regex' => 'The slug may only contain lowercase letters, numbers, and hyphens.',
            'route_prefix.regex' => 'The route prefix may only contain lowercase letters, numbers, hyphens, and slashes.',
        ];
    }
}
