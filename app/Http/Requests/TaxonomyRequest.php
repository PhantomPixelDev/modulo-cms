<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TaxonomyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $taxonomy = $this->route('taxonomy');
        $id = is_object($taxonomy) ? ($taxonomy->id ?? null) : null;

        return [
            'name' => [
                'required','string','max:100',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('taxonomies','name')->ignore($id),
            ],
            'label' => ['required','string','max:100'],
            'plural_label' => ['required','string','max:100'],
            'description' => ['nullable','string'],
            'slug' => [
                'required','string','max:100',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('taxonomies','slug')->ignore($id),
            ],
            'is_hierarchical' => ['boolean'],
            'is_public' => ['boolean'],
            'post_types' => ['nullable','array'],
            'post_types.*' => ['nullable', function ($attr, $value, $fail) {
                // Accept integer post_type IDs or string slugs
                if (is_int($value) || ctype_digit((string)$value)) {
                    if (!\Illuminate\Support\Facades\DB::table('post_types')->where('id', (int)$value)->exists()) {
                        $fail('Selected post type does not exist.');
                    }
                } else {
                    if (!is_string($value) || !preg_match('/^[a-z0-9-]+$/', $value)) {
                        $fail('Invalid post type identifier.');
                        return;
                    }
                    if (!\Illuminate\Support\Facades\DB::table('post_types')->where('slug', $value)->exists()) {
                        $fail('Selected post type does not exist.');
                    }
                }
            }],
            'show_in_menu' => ['boolean'],
            'menu_icon' => ['nullable','string','max:191'],
            'menu_position' => ['nullable','integer','between:-2147483648,2147483647'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.regex' => 'The name may only contain lowercase letters, numbers, and underscores.',
            'slug.regex' => 'The slug may only contain lowercase letters, numbers, and hyphens.',
        ];
    }
}
