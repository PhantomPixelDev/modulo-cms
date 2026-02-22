<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $item = $this->route('menuItem');
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
            'url' => ['nullable', 'string', 'max:2048'],
            'page_slug' => ['nullable', 'string', 'max:255'],
            'route_name' => ['nullable', 'string', 'max:255'],
            'order' => ['nullable', 'integer'],
            'visible_to' => ['nullable', 'in:all,guest,auth'],
            'target' => ['nullable', 'in:_self,_blank'],
            'translations' => ['sometimes', 'array'],
            'translations.*.locale' => ['required', 'string', 'max:8', Rule::exists('locales', 'code')],
            'translations.*.label' => ['nullable', 'string', 'max:255'],
            'translations.*.url' => ['nullable', 'string', 'max:2048'],
        ];
    }
}
