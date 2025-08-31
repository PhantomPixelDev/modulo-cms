<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class NewPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required','string'],
            'email' => ['required','email','max:255'],
            'password' => ['required','confirmed', Rules\Password::defaults()],
        ];
    }
}
