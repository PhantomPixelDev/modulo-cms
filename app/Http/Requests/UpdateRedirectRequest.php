<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRedirectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_path' => ['required', 'string', 'max:500', 'regex:/^\/?[^\s]*$/'],
            'to_url' => ['required', 'string', 'max:1000', 'regex:#^(/|https?://)#i'],
            'status_code' => ['required', 'integer', Rule::in([301, 302, 307, 308])],
        ];
    }
}
