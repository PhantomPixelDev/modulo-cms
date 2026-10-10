<?php

namespace App\Http\Requests;

use App\Support\ContentRules;
use App\Support\CustomFields;
use App\Support\EditorSave;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        $post = $this->route('post');

        return auth()->check() && auth()->user()->can('update', $post);
    }

    public function rules(): array
    {
        return ContentRules::postEditor($this, $this->route('post'));
    }

    protected function prepareForValidation(): void
    {
        EditorSave::prepare($this, $this->route('post'));
        if (! $this->has('slug') && $this->has('title')) {
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
