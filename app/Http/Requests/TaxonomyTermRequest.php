<?php

namespace App\Http\Requests;

use App\Models\TaxonomyTerm;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TaxonomyTermRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $term = $this->currentTerm();
        $id = is_object($term) ? ($term->id ?? null) : null;

        return [
            'taxonomy_id' => ['required', 'integer', 'exists:taxonomies,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:taxonomy_terms,id'],
            'term_order' => ['nullable', 'integer', 'min:0', 'max:10000'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string'],
            'translations' => ['sometimes', 'array'],
            'translations.*.locale' => ['required', 'string', 'max:8', Rule::exists('locales', 'code')],
            'translations.*.name' => ['nullable', 'string', 'max:255'],
            'translations.*.slug' => ['nullable', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string'],
            'translations.*.meta_data' => ['nullable', 'array'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $taxonomyId = (int) $this->input('taxonomy_id');
            $term = $this->currentTerm();
            $parentId = $this->input('parent_id', $term?->parent_id);

            if ($term && $taxonomyId !== (int) $term->taxonomy_id && $term->children()->exists()) {
                $validator->errors()->add('taxonomy_id', 'A term with children must stay in its taxonomy.');

                return;
            }

            // parent must belong to same taxonomy
            if ($parentId) {
                $parent = DB::table('taxonomy_terms')->where('id', (int) $parentId)->first();
                if ($parent && (int) $parent->taxonomy_id !== $taxonomyId) {
                    $validator->errors()->add('parent_id', 'Parent term must belong to the same taxonomy.');
                }
                if ($term) {
                    $parents = DB::table('taxonomy_terms')->where('taxonomy_id', $taxonomyId)->pluck('parent_id', 'id')->all();
                    $seen = [$term->id => true];
                    for ($at = (int) $parentId; $at !== null; $at = $parents[$at] ?? null) {
                        if (isset($seen[$at])) {
                            $validator->errors()->add('parent_id', 'A term cannot be moved into itself or a descendant.');

                            return;
                        }
                        $seen[$at] = true;
                    }
                }
            }
        });
    }

    protected function currentTerm(): ?TaxonomyTerm
    {
        $term = $this->route('taxonomyTerm') ?? $this->route('taxonomy_term') ?? $this->route('term');

        return $term instanceof TaxonomyTerm ? $term : null;
    }
}
