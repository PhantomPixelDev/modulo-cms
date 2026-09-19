<?php

namespace App\Http\Requests;

use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->can('create', Post::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $postTypeId = $this->input('post_type_id');
        $postType = PostType::find($postTypeId);

        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'alpha_dash:ascii',
                // posts.slug is unique across all post types at the database level
                Rule::unique('posts', 'slug')
                    ->ignore($this->route('post')),
            ],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'archived'])],
            'published_at' => ['nullable', 'date'],
            'featured_image' => ['nullable', 'string', 'max:255'],
            'post_type_id' => ['required', 'exists:post_types,id'],
            'taxonomy_terms' => ['nullable', 'array'],
            'taxonomy_terms.*' => ['exists:taxonomy_terms,id'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_data' => ['nullable', 'array'],
        ];

        // Add validation for required fields based on post type
        if ($postType) {
            // has_excerpt / has_featured_image mean the type *supports* the field;
            // they stay optional (nullable rules above).

            // Validate taxonomy terms if post type has taxonomies
            if ($postType->has_taxonomies && ! empty($this->input('taxonomy_terms'))) {
                $rules['taxonomy_terms.*'] = [
                    'exists:taxonomy_terms,id',
                    function ($attribute, $value, $fail) use ($postType) {
                        $term = TaxonomyTerm::find($value);
                        if ($term && $term->taxonomy->post_type_id !== $postType->id) {
                            $fail('The selected taxonomy term is invalid for this post type.');
                        }
                    },
                ];
            }
        }

        return $rules;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // Generate slug from title if not provided
        if (! $this->filled('slug') && $this->filled('title')) {
            $this->merge([
                'slug' => Str::slug($this->title),
            ]);
        }
    }
}
