<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\PostType;
use App\Models\TaxonomyTerm;

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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
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
                Rule::unique('posts', 'slug')
                    ->where('post_type_id', $postTypeId)
                    ->ignore($this->route('post'))
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
            if ($postType->has_featured_image) {
                $rules['featured_image'] = ['required', 'string', 'max:255'];
            }
            
            if ($postType->has_excerpt) {
                $rules['excerpt'] = ['required', 'string', 'max:500'];
            }
            
            // Validate taxonomy terms if post type has taxonomies
            if ($postType->has_taxonomies && !empty($this->input('taxonomy_terms'))) {
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
        if (!$this->has('slug') && $this->has('title')) {
            $this->merge([
                'slug' => \Illuminate\Support\Str::slug($this->title)
            ]);
        }
    }
}
