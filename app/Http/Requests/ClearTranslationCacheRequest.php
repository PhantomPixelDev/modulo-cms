<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClearTranslationCacheRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'locale' => 'nullable|string|max:10',
        ];
    }
}
