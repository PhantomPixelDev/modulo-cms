<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        $post = $this->route('post');
        return auth()->check() && auth()->user()->can('update', $post);
    }

    public function rules(): array
    {
        $post = $this->route('post');
        $postTypeId = $this->input('post_type_id');
        $postType = PostType::find($postTypeId);

        $rules = [
            'post_type_id' => ['required', 'exists:post_types,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash:ascii',
                Rule::unique('posts', 'slug')
                    ->where('post_type_id', $postTypeId)
                    ->ignore($post?->id),
            ],
            'content' => ['required', 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'private', 'archived'])],
            'featured_image' => ['nullable', 'string', 'max:255'],
            'taxonomy_terms' => ['nullable', 'array'],
            'taxonomy_terms.*' => ['exists:taxonomy_terms,id'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
            'author_id' => ['nullable', 'exists:users,id'],
            'parent_id' => ['nullable', 'exists:posts,id'],
            'menu_order' => ['nullable', 'integer'],
            'meta_data' => ['nullable', 'array'],
        ];

        if ($postType) {
            if ($postType->has_featured_image) {
                $rules['featured_image'] = ['required', 'string', 'max:255'];
            }

            if ($postType->has_excerpt) {
                $rules['excerpt'] = ['required', 'string', 'max:500'];
            }

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

    protected function prepareForValidation(): void
    {
        if (!$this->has('slug') && $this->has('title')) {
            $this->merge([
                'slug' => \Illuminate\Support\Str::slug($this->title),
            ]);
        }
    }
}
