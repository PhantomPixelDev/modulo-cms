<?php

namespace App\Support;

use App\Models\Post;
use App\Models\PostType;
use Illuminate\Validation\Rule;

/**
 * Extra fields a post type asks for, like a price, an event date or a
 * subtitle. The post type holds the definitions; each post keeps its values
 * in meta_data.fields, keyed by the field key.
 */
class CustomFields
{
    public const TYPES = ['text', 'textarea', 'number', 'url', 'email', 'date', 'toggle', 'select', 'image'];

    /**
     * Rules for the definitions as the post type editor sends them.
     *
     * @return array<string, mixed>
     */
    public static function definitionRules(): array
    {
        return [
            'fields' => ['nullable', 'array', 'max:50'],
            'fields.*.key' => ['required', 'string', 'regex:/^[a-z][a-z0-9_]{0,39}$/', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:100'],
            'fields.*.type' => ['required', Rule::in(self::TYPES)],
            'fields.*.help' => ['nullable', 'string', 'max:255'],
            'fields.*.required' => ['nullable', 'boolean'],
            'fields.*.options' => ['nullable', 'array', 'max:50'],
            'fields.*.options.*' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Definitions as they are stored: known keys only, options only on selects.
     *
     * @param  array<int, array<string, mixed>>|null  $fields
     * @return array<int, array<string, mixed>>
     */
    public static function normalize(?array $fields): array
    {
        return array_values(array_map(fn (array $field) => array_filter([
            'key' => (string) $field['key'],
            'label' => (string) $field['label'],
            'type' => (string) $field['type'],
            'help' => isset($field['help']) && $field['help'] !== '' ? (string) $field['help'] : null,
            'required' => ! empty($field['required']),
            'options' => $field['type'] === 'select'
                ? array_values(array_filter(array_map('strval', (array) ($field['options'] ?? [])), fn ($option) => $option !== ''))
                : null,
        ], fn ($value) => $value !== null), $fields ?? []));
    }

    /**
     * Rules for a post's values, from its type's definitions.
     *
     * @return array<string, mixed>
     */
    public static function valueRules(?PostType $postType): array
    {
        $rules = ['meta_data.fields' => ['nullable', 'array']];

        foreach ($postType !== null ? (array) $postType->fields : [] as $field) {
            $base = ! empty($field['required']) && $field['type'] !== 'toggle' ? ['required'] : ['nullable'];
            $rules['meta_data.fields.'.$field['key']] = array_merge($base, match ($field['type']) {
                'number' => ['numeric'],
                'url' => ['string', 'max:2048', 'regex:#^(https?://|/)#i'],
                'email' => ['email', 'max:255'],
                'date' => ['date'],
                'toggle' => ['boolean'],
                'select' => [Rule::in((array) ($field['options'] ?? []))],
                'image' => ['string', 'max:2048'],
                'textarea' => ['string', 'max:10000'],
                default => ['string', 'max:1000'],
            });
        }

        return $rules;
    }

    /**
     * Friendly names for validation messages ("Price" rather than meta_data.fields.price).
     *
     * @return array<string, string>
     */
    public static function attributes(?PostType $postType): array
    {
        $names = [];
        foreach ($postType !== null ? (array) $postType->fields : [] as $field) {
            $names['meta_data.fields.'.$field['key']] = (string) $field['label'];
        }

        return $names;
    }

    /**
     * A post's values for its type's fields, for themes.
     *
     * @return array<string, mixed>
     */
    public static function values(Post $post): array
    {
        $stored = (array) (((array) $post->meta_data)['fields'] ?? []);
        $values = [];

        foreach ((array) $post->postType?->fields as $field) {
            $value = $stored[$field['key']] ?? null;
            $values[$field['key']] = match ($field['type']) {
                'toggle' => (bool) $value,
                'number' => is_numeric($value) ? $value + 0 : null,
                default => $value === '' ? null : $value,
            };
        }

        return $values;
    }
}
