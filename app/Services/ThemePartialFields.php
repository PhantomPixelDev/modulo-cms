<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

/** Optional editor hints. Public shortcodes retain their string-based contract. */
class ThemePartialFields
{
    public const TYPES = ['text', 'textarea', 'select', 'boolean', 'image'];

    /** @return list<string> */
    public function manifestErrors(array $definition): array
    {
        $fields = $definition['fields'] ?? [];
        if (! is_array($fields)) {
            return ['fields must be an object.'];
        }
        $errors = [];
        foreach ($fields as $name => $field) {
            if (! is_string($name) || $name === 'name' || ! preg_match('/^[a-z][a-z0-9_-]*$/D', $name) || ! is_array($field)
                || ! in_array($field['type'] ?? '', self::TYPES, true)) {
                $errors[] = 'fields need valid attribute names and supported types.';

                continue;
            }
            foreach (['label', 'help'] as $key) {
                if (isset($field[$key]) && ! is_string($field[$key])) {
                    $errors[] = "{$name}.{$key} must be a string.";
                }
            }
            if (isset($field['required']) && ! is_bool($field['required'])) {
                $errors[] = "{$name}.required must be a boolean.";
            }
            if ($field['type'] === 'select') {
                $options = $field['options'] ?? [];
                if (! is_array($options) || ! array_is_list($options) || count($options) < 1 || count($options) > 50) {
                    $errors[] = "{$name}.options must be a non-empty list (up to 50 choices).";
                } else {
                    $values = [];
                    foreach ($options as $option) {
                        if (! is_array($option) || ! is_string($option['value'] ?? null) || ! is_string($option['label'] ?? null)
                            || in_array($option['value'], $values, true)) {
                            $errors[] = "{$name}.options need unique string values and labels.";
                        } else {
                            $values[] = $option['value'];
                        }
                    }
                }
            }
        }

        return $errors;
    }

    /** @return list<array{name: string, type: string, label: string, help: string, required: bool, options: list<array{value: string, label: string}>}> */
    public function catalog(array $definition): array
    {
        $fields = $this->manifestErrors($definition) === [] ? ($definition['fields'] ?? []) : [];
        foreach (array_keys($definition['defaults'] ?? []) as $name) {
            if (is_string($name) && $name !== 'name' && preg_match('/^[a-z][a-z0-9_-]*$/D', $name)) {
                $fields[$name] ??= ['type' => 'text'];
            }
        }
        $result = [];
        foreach ($fields as $name => $field) {
            $result[] = [
                'name' => $name, 'type' => $field['type'], 'label' => $field['label'] ?? $name,
                'help' => $field['help'] ?? '', 'required' => $field['required'] ?? false,
                'options' => $field['type'] === 'select' ? $field['options'] : [],
            ];
        }

        return $result;
    }

    /** Validate values created by the editor; legacy public content is untouched. */
    public function validate(array $fields, array $attributes): void
    {
        $errors = [];
        foreach ($fields as $field) {
            $value = $attributes[$field['name']] ?? '';
            $invalid = ($field['required'] && trim($value) === '')
                || ($value !== '' && $field['type'] === 'select' && ! in_array($value, array_column($field['options'], 'value'), true))
                || ($field['type'] === 'boolean' && ! in_array($value, ['true', 'false'], true))
                || ($value !== '' && $field['type'] === 'image' && ! self::imageUrl($value));
            if ($invalid) {
                $errors['attributes.'.$field['name']] = __('dashboard.partials.invalid_field', ['name' => $field['label']]);
            }
        }
        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }
    }

    public static function imageUrl(string $value): bool
    {
        return ! preg_match('/[\x00-\x20\\\\]/', $value)
            && (preg_match('~^https?://~i', $value) || (str_starts_with($value, '/') && ! str_starts_with($value, '//')));
    }
}
