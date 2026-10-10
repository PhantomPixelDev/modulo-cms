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
                if (! in_array($type, ['color', 'select', 'boolean'], true)) {
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
                    'group' => in_array($field['group'] ?? '', ['colors', 'dark_colors', 'layout'], true) ? $field['group'] : 'layout',
                    'default' => $field['default'] ?? null,
                    'options' => $type === 'select' ? $options : [],
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
            default => throw new \LogicException('Unsupported theme setting type.'),
        };
    }

    /** @return array<string, string|bool> */
    public function values(Theme $theme): array
    {
        $values = [];
        foreach ($this->fields($theme) as $key => $field) {
            $value = ($theme->settings ?? [])[$key] ?? $field['default'];
            if (Validator::make(['value' => $value], ['value' => $this->rulesFor($field)])->fails()) {
                $value = $field['default'];
            }
            $values[$key] = $field['type'] === 'boolean' ? (bool) $value : (string) $value;
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

        return Validator::make($input, $rules)->validate()['values'];
    }
}
