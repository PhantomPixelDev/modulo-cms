# Plugin Lifecycle

This page explains plugin discovery and state transitions.

## Discovery

- Plugin directories are scanned under `plugins/`.
- Valid `plugin.json` files are synced to DB records.
- Discovery can be cached using a filesystem fingerprint.

## Activation

When a plugin is activated:
1. DB record `is_active` is set.
2. Optional plugin migrations run (if `migrations_path` exists).
3. Optional plugin seeder runs (if `seeder` class exists).
4. If setup fails, activation is rolled back.

## Deactivation

- `is_active` is set to `false`.
- Plugin files are preserved.

## Uninstall

- Plugin is deactivated.
- Uninstall marker file (`.modulo-uninstalled`) is written.
- Plugin DB record is removed.
- Files are not automatically deleted for safety.

## Runtime loading

Active plugins are expected to register providers and resources (routes, migrations, lang, views).

## Related docs

- [Plugin Manifest Spec](./plugin-manifest-spec.md)
- [Plugin Development Guide](./plugin-development-guide.md)
