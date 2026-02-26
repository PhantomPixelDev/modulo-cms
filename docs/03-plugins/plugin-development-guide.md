# Plugin Development Guide

Use this guide to build and register new plugins.

## 1) Create plugin folder

Create `plugins/<MyPlugin>/` with at least:
- `plugin.json`
- `<MyPlugin>ServiceProvider.php`

## 2) Manifest

Add required fields:
- `name`, `slug`, `version`, `service_provider`

Optional:
- `settings`, `migrations_path`, `seeder`

## 3) Service provider

Recommended approach:
- Extend `App\\Plugins\\BasePluginServiceProvider`
- Set `pluginBasePath` and `pluginSlug`
- Register bindings in `register()`
- Add plugin boot logic in `bootPlugin()`

Base provider can auto-load:
- `routes/web.php`
- `database/migrations`
- `lang`
- `resources/views`

## 4) Register and activate

1. Go to admin plugins page.
2. Run discover action.
3. Activate plugin.
4. Validate plugin routes/features.

## 5) Troubleshooting

- Plugin not listed: validate `plugin.json` required keys.
- Activation fails: check migration/seeder classes and logs.
- Routes missing: ensure `routes/web.php` exists and provider boots.

## Related docs

- [Plugin Manifest Spec](./plugin-manifest-spec.md)
- [Plugin Lifecycle](./plugin-lifecycle.md)
- [ModuloShop Plugin Guide](./moduloshop-plugin-guide.md)
