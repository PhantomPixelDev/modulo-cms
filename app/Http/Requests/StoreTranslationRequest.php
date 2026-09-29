<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTranslationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'locale' => 'required|string|max:10',
            'domain' => 'required|string|max:64',
            'key' => 'required|string|max:255',
            'value' => 'nullable|string',
        ];
    }
}
