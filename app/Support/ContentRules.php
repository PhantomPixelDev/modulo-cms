<?php

namespace App\Support;

use App\Models\Post;
use App\Models\PostType;
use App\Models\TaxonomyTerm;
use App\Rules\AssignAuthor;
use App\Rules\CanPublish;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Shared field contracts; each channel retains its existing optional fields. */
class ContentRules
{
    /** @return array<string, array<mixed>> */
    public static function text(string $presence = 'required'): array
    {
        return [
            'title' => [$presence, 'string', 'max:255'],
            'content' => [$presence, 'string'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'featured_image' => ['nullable', 'string', 'max:255'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public static function postType(Request $request): ?PostType
    {
        $id = $request->input('post_type_id');

        return is_numeric($id) ? PostType::find((int) $id) : null;
    }

    /** @return array<string, mixed> */
    public static function postEditor(Request $request, ?Post $post = null): array
    {
        $type = self::postType($request);
        $rules = self::text() + [
            'post_type_id' => ['required', 'integer', 'exists:post_types,id'],
            'slug' => [$post ? 'nullable' : 'required', 'string', 'max:255', 'alpha_dash:ascii', Rule::unique('posts', 'slug')->ignore($post?->id)],
            'status' => ['required', 'string', Rule::in($post ? ['draft', 'published', 'private', 'archived'] : ['draft', 'published', 'archived']), CanPublish::forRequest($request, $post)],
            'published_at' => ['nullable', 'date'],
            'author_id' => ['nullable', 'integer', 'exists:users,id', new AssignAuthor],
            'taxonomy_terms' => ['nullable', 'array'],
            'taxonomy_terms.*' => ['integer', 'exists:taxonomy_terms,id'],
            'meta_data' => ['nullable', 'array'],
        ];
        if ($post) {
            $rules['parent_id'] = ['nullable', 'integer', 'exists:posts,id'];
            $rules['menu_order'] = ['nullable', 'integer'];
        }
        if ($type?->has_taxonomies && ! empty($request->input('taxonomy_terms'))) {
            $rules['taxonomy_terms.*'][] = function (string $attribute, mixed $value, Closure $fail) use ($type): void {
                $term = is_numeric($value) ? TaxonomyTerm::with('taxonomy')->find((int) $value) : null;
                $allowed = array_map('strval', (array) ($term?->taxonomy->post_types ?? []));
                if ($term && $allowed !== [] && array_intersect($allowed, [$type->name, $type->slug, (string) $type->id]) === []) {
                    $fail('The selected taxonomy term is invalid for this post type.');
                }
            };
        }

        return $rules + CustomFields::valueRules($type);
    }
}
