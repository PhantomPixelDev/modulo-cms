<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLocaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'native_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'direction' => ['sometimes', Rule::in(['ltr', 'rtl'])],
            'is_active' => ['sometimes', 'boolean'],
            'is_default' => ['sometimes', 'accepted'],
        ];
    }
}
