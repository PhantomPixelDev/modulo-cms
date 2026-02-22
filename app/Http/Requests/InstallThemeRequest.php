<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InstallThemeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'max:255'],
        ];
    }
}
