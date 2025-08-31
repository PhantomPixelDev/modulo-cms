<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class TaxonomyTermRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $term = $this->route('taxonomyTerm') ?? $this->route('term');
        $id = is_object($term) ? ($term->id ?? null) : null;

        return [
            'taxonomy_id' => ['required','integer','exists:taxonomies,id'],
            'name' => ['required','string','max:255'],
            'description' => ['nullable','string'],
            'parent_id' => ['nullable','integer','exists:taxonomy_terms,id'],
            'term_order' => ['nullable','integer','min:0','max:10000'],
            'meta_title' => ['nullable','string','max:255'],
            'meta_description' => ['nullable','string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $taxonomyId = (int) $this->input('taxonomy_id');
            $parentId = $this->input('parent_id');
            $term = $this->route('taxonomyTerm') ?? $this->route('term');

            // parent must belong to same taxonomy
            if ($parentId) {
                $parent = DB::table('taxonomy_terms')->where('id', (int)$parentId)->first();
                if ($parent && (int)$parent->taxonomy_id !== $taxonomyId) {
                    $validator->errors()->add('parent_id', 'Parent term must belong to the same taxonomy.');
                }
                if ($term && (int)$term->id === (int)$parentId) {
                    $validator->errors()->add('parent_id', 'A term cannot be its own parent.');
                }
            }
        });
    }
}
