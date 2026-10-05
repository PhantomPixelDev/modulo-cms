<?php

namespace App\Http\Requests;

use App\Http\Controllers\Content\MenuController;
use App\Models\MenuItem;
use App\Rules\SafeUrl;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class MenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $item = $this->route('menuItem') ?? $this->route('menu_item');
        $isUpdate = (bool) $item;

        $menuIdRules = $isUpdate
            ? ['sometimes', 'integer', 'exists:menus,id']
            : ['required', 'integer', 'exists:menus,id'];

        $parentRules = ['nullable', 'integer', 'exists:menu_items,id'];
        if ($item) {
            $parentRules[] = Rule::notIn([$item->id]);
        }

        return [
            'menu_id' => $menuIdRules,
            'parent_id' => $parentRules,
            'label' => ['required', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:2048', new SafeUrl],
            'page_slug' => ['nullable', 'string', 'max:255'],
            'route_name' => ['nullable', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
            'visible_to' => ['nullable', 'in:all,guest,auth'],
            'target' => ['nullable', 'in:_self,_blank'],
            'translations' => ['sometimes', 'array'],
            'translations.*.locale' => ['required', 'string', 'max:8', Rule::exists('locales', 'code')],
            'translations.*.label' => ['nullable', 'string', 'max:255'],
            'translations.*.url' => ['nullable', 'string', 'max:2048', new SafeUrl],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var MenuItem|null $item */
            $item = $this->route('menuItem') ?? $this->route('menu_item');
            $menuId = (int) $this->input('menu_id', $item?->menu_id);
            if ($item && $menuId !== (int) $item->menu_id) {
                $validator->errors()->add('menu_id', 'An existing item must stay in its menu.');

                return;
            }

            // Validate the proposed tree in one query, including the moved subtree.
            $parents = MenuItem::where('menu_id', $menuId)->pluck('parent_id', 'id')->all();
            $id = $item->id ?? 0;
            $parent = $this->input('parent_id', $item?->parent_id);
            $parent = $parent === null ? null : (int) $parent;
            if ($parent !== null && ! array_key_exists($parent, $parents)) {
                $validator->errors()->add('parent_id', 'The parent must belong to the same menu.');

                return;
            }
            $parents[$id] = $parent;

            foreach ($parents as $childId => $parentId) {
                $seen = [$childId => true];
                for ($at = $parentId; $at !== null; $at = $parents[$at] ?? null) {
                    if (isset($seen[$at]) || count($seen) >= MenuController::MAX_DEPTH) {
                        $validator->errors()->add('parent_id', 'Menus must be acyclic and at most '.MenuController::MAX_DEPTH.' levels deep.');

                        return;
                    }
                    $seen[$at] = true;
                }
            }
        }];
    }
}
