<?php

namespace App\Http\Requests;

use App\Models\Post;
use App\Support\ContentRules;
use App\Support\CustomFields;
use App\Support\EditorSave;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->can('create', Post::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return ContentRules::postEditor($this);
    }

    protected function prepareForValidation()
    {
        EditorSave::prepare($this);
        // Generate slug from title if not provided
        if (! $this->filled('slug') && $this->filled('title')) {
            $this->merge([
                'slug' => Str::slug($this->title),
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return CustomFields::attributes(ContentRules::postType($this));
    }
}
