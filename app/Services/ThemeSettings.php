<?php

namespace App\Services;

use App\Models\Theme;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/** Theme manifests declare controls; saved values never modify theme files. */
class ThemeSettings
{
    /** @return array<string, array<string, mixed>> */
    public function fields(Theme $theme): array
    {
        $fields = [];
        $seen = [];
        for ($current = $theme; $current !== null && ! in_array($current->id, $seen, true); $current = $current->parent) {
            $seen[] = $current->id;
            $declared = $current->config['settings'] ?? [];
            if (! is_array($declared)) {
                continue;
            }
            foreach ($declared as $key => $field) {
                if (! is_string($key) || ! preg_match('/^[a-z][a-z0-9_]{0,63}$/D', $key)
                    || ! is_array($field) || isset($fields[$key])) {
                    continue;
                }
                $type = $field['type'] ?? null;
                if (! in_array($type, ['color', 'select', 'boolean', 'text', 'image', 'number'], true)) {
                    continue;
                }
                $options = $field['options'] ?? [];
                if ($type === 'select' && (! is_array($options) || ! $options || count($options) > 30
                    || count(array_filter($options, fn ($label, $value) => is_string($label) && is_string($value) && strlen($value) <= 80, ARRAY_FILTER_USE_BOTH)) !== count($options))) {
                    continue;
                }
                $normalized = [
                    'type' => $type,
                    'label' => is_string($field['label'] ?? null) ? $field['label'] : $key,
                    'group' => in_array($field['group'] ?? '', ['branding', 'header', 'footer', 'colors', 'dark_colors', 'layout'], true) ? $field['group'] : 'layout',
                    'default' => $field['default'] ?? null,
                    'options' => $type === 'select' ? $options : [],
                    'min' => max(0, min(1000, (int) ($field['min'] ?? 0))),
                    'max' => max(0, min(1000, (int) ($field['max'] ?? 100))),
                ];
                if (! Validator::make(['value' => $normalized['default']], ['value' => $this->rulesFor($normalized)])->fails()) {
                    $fields[$key] = $normalized;
                }
            }
        }

        return $fields;
    }

    /** @param array<string, mixed> $field */
    private function rulesFor(array $field): array
    {
        return match ($field['type']) {
            'color' => ['required', 'string', 'regex:/^#[0-9a-fA-F]{6}$/D'],
            'select' => ['required', 'string', Rule::in(array_keys($field['options']))],
            'boolean' => ['required', 'boolean'],
            'text' => ['present', 'nullable', 'string', 'max:500'],
            'image' => ['present', 'nullable', 'string', 'max:1000', 'regex:#^(?:/(?!/)[^\s]*|https?://[^\s]+)$#i'],
            'number' => ['required', 'integer', 'min:'.$field['min'], 'max:'.$field['max']],
            default => throw new \LogicException('Unsupported theme setting type.'),
        };
    }

    /** @return array<string, string|bool|int> */
    public function values(Theme $theme): array
    {
        $values = [];
        foreach ($this->fields($theme) as $key => $field) {
            $value = ($theme->settings ?? [])[$key] ?? $field['default'];
            if (Validator::make(['value' => $value], ['value' => $this->rulesFor($field)])->fails()) {
                $value = $field['default'];
            }
            $values[$key] = match ($field['type']) {
                'boolean' => (bool) $value,
                'number' => (int) $value,
                default => (string) $value,
            };
        }

        return $values;
    }

    /** Validate complete form submissions and refuse undeclared controls. */
    public function validate(Theme $theme, array $input): array
    {
        $fields = $this->fields($theme);
        $rules = ['values' => ['present', $fields ? 'array:'.implode(',', array_keys($fields)) : 'array', ...($fields ? [] : ['max:0'])]];
        foreach ($fields as $key => $field) {
            $rules['values.'.$key] = $this->rulesFor($field);
        }

        $values = Validator::make($input, $rules)->validate()['values'];
        foreach ($fields as $key => $field) {
            $values[$key] = match ($field['type']) {
                'boolean' => (bool) $values[$key],
                'number' => (int) $values[$key],
                default => (string) $values[$key],
            };
        }

        return $values;
    }
}
