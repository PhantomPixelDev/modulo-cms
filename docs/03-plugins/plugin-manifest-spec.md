# Plugin Manifest Spec

Each plugin must include a `plugin.json` manifest at plugin root.

## Required fields

- `name` (string)
- `slug` (string)
- `version` (string)
- `service_provider` (string)

## Optional fields

- `description`
- `author`
- `settings` (object)
- `migrations_path` (relative path)
- `seeder` (FQCN)

## Validation rules

- `service_provider` must not contain traversal-like values (`..`).
- `service_provider` must follow `Plugins\\<FolderName>\\...` convention.
- Invalid manifests are skipped during discovery.

## Example

```json
{
  "name": "Hello World",
  "slug": "hello-world",
  "version": "1.0.0",
  "service_provider": "Plugins\\HelloWorld\\HelloWorldServiceProvider"
}
```

## Related docs

- [Plugin Lifecycle](./plugin-lifecycle.md)
- [Plugin Development Guide](./plugin-development-guide.md)
