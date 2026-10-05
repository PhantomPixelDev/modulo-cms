<?php

namespace App\Rules;

use App\Services\HtmlSanitizer;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && ! HtmlSanitizer::isSafeUrl($value)) {
            $fail('The URL must use http, https, mailto, tel, or a relative path.');
        }
    }
}
