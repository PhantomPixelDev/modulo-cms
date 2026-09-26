<?php

namespace App\Services\Plugins;

use App\Services\PluginManager;
use App\Support\CustomFields;

/**
 * The settings form a plugin describes in plugin.json, with the same field
 * types as content-type custom fields:
 *
 *   "settings_schema": [
 *     { "key": "recipient_email", "type": "email", "label": "Send messages to",
 *       "label_key": "contact-form::settings.recipient", "help": "…", "required": true }
 *   ]
 *
 * Plugins without a schema keep the plain key/value editor.
 */
class PluginSettingsSchema
{
    public function __construct(protected PluginManager $plugins) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function fields(string $slug): array
    {
        $schema = data_get($this->plugins->manifest($slug), 'settings_schema');
        if (! is_array($schema)) {
            return [];
        }

        $fields = [];
        foreach ($schema as $field) {
            if (! is_array($field) || ! isset($field['key'], $field['type']) || ! in_array($field['type'], CustomFields::TYPES, true)
                || preg_match('/^[a-z][a-z0-9_]{0,39}$/', (string) $field['key']) !== 1) {
                continue;
            }
            $field['label'] = $this->translated($field['label_key'] ?? null, (string) ($field['label'] ?? $field['key']));
            $field['help'] = isset($field['help']) || isset($field['help_key'])
                ? $this->translated($field['help_key'] ?? null, (string) ($field['help'] ?? ''))
                : null;
            $fields[] = $field;
        }

        return CustomFields::normalize($fields);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(string $slug): array
    {
        return CustomFields::rulesFor($this->fields($slug), 'settings.');
    }

    /**
     * @return array<string, string>
     */
    public function attributes(string $slug): array
    {
        $names = [];
        foreach ($this->fields($slug) as $field) {
            $names['settings.'.$field['key']] = (string) $field['label'];
        }

        return $names;
    }

    protected function translated(mixed $key, string $fallback): string
    {
        return is_string($key) && $key !== '' && __($key) !== $key ? (string) __($key) : $fallback;
    }
}
