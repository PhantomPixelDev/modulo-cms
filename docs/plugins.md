# Plugins

## Installing

```bash
php artisan plugin:list --available          # what the registry offers
php artisan plugin:install contact-form      # download, verify, install
php artisan plugin:activate contact-form
php artisan plugin:list --updates            # what has a newer release
php artisan plugin:update --all
```

Or from the admin: **Plugins → Browse registry** searches the registry and installs
with one click (the plugin arrives inactive), and **System → Updates** lists and
applies plugin updates. A daily check emails administrators when updates appear.

**A plugin is not sandboxed.** It runs as part of the application, with the same
database and filesystem access. Installing one is equivalent to deploying code, and
the `install plugins` permission should be held only by people you would trust with
shell access to the server.

## What is verified, and what is not

Every install downloads over HTTPS from an allowlisted host, then checks the package
against the SHA-256 recorded in the registry before anything is unpacked. A mismatch
aborts the install.

That checksum is the trust root. It is honest to describe an install as
**checksum-verified against the registry**; it would be dishonest to call it *signed*,
because nothing today carries a signature of its own — the registry is the only
authority, and anyone who controls the registry controls what gets installed.
Package signing is a later addition.

The package is then unpacked defensively, because `ZipArchive::extractTo()` checks
none of this:

| Rejected | Why |
|---|---|
| Entries containing `..` | Zip-slip: writes outside the destination |
| Absolute paths | Same |
| Symbolic links | A link out of the tree turns a later write into an arbitrary one |
| Null bytes in names | Truncation tricks |
| More than 5,000 entries | Exhaustion |
| Files over 64MB, or 256MB total | Zip bombs; checked against the declared size *and* enforced while copying, since the header can lie |
| Executables, shared objects, unknown types | Extension allowlist |

Validation runs over the whole archive **before a single byte is written**, so a
rejected entry cannot leave a half-extracted plugin behind.

PHP *is* allowed, because shipping PHP is what a plugin is. What stops that being a
remote code execution hole is elsewhere: plugin PHP is never copied into `public/`,
and the web server only ever executes `/index.php` — a stray `.php` anywhere else,
including under `/storage`, returns 404.

The install is staged. The package is downloaded, verified, extracted and validated in
a temporary directory; only then is the existing plugin moved aside and the new one
moved into place. If that fails, the previous version is restored rather than leaving
the site with no plugin at all.

## Where a plugin is placed

By its declared `namespace`, never by the archive's folder name — a GitHub archive
extracts as `<repo>-<ref>`, which would not match. PSR-4 resolves `Plugins\<Folder>`
by path, so the two have to agree or the classes never load.

```json
{
  "name": "Contact Form",
  "slug": "contact-form",
  "namespace": "ContactForm",
  "version": "1.0.0",
  "service_provider": "Plugins\\ContactForm\\ContactFormServiceProvider",
  "migrations_path": "database/migrations"
}
```

A manifest that cannot be loaded is reported with the reason, rather than the package
silently not appearing.

`migrations_path` is what makes activation and updates create the plugin's tables.
Its migrations run whenever the plugin is switched on, and on every update. The
optional `seeder` runs on each activation too, so it must be idempotent — use
`firstOrCreate` / `updateOrCreate`, as the bundled plugins do.

## Updating

`plugin:update` compares the registry's version with the installed one. New
migrations run **before** the version is recorded, so a failed migration leaves the
recorded version behind and the update is retried rather than assumed done. A package
older than what is installed is refused before it is downloaded; rolling a plugin's
schema backwards is not something this can do safely. Uninstall the plugin first if an
older version is really needed.

## Docker

Two volumes matter:

- `plugins` — plugins installed at runtime live outside the image, or they would be
  discarded every time the image is replaced.
- `plugin_assets` — mounted read-only into the web container at
  `public/plugins`. The nginx image bakes `public/` in at build time, so anything
  written there at runtime is invisible to it otherwise.

The image ships no plugins: a site installs the ones it wants from the registry, and
updating the image never touches them. On boot the app republishes the installed
plugins' browser files (`plugin:publish-assets`) into `plugin_assets`.

## Admin menu

A plugin adds its entries to the admin sidebar (under **Extensions**) from
`plugin.json`:

```json
"admin": {
  "menu": [{
    "label": "Shop",
    "label_key": "modulo-shop::admin.menu.shop",
    "icon": "shopping-bag",
    "route": "dashboard.admin.shop.products.index",
    "permissions": ["view shop products", "view shop orders"],
    "children": [
      { "label": "Orders", "route": "dashboard.admin.shop.orders.index", "permissions": ["view shop orders"] }
    ]
  }]
}
```

- **Link**: `route` (a route name the plugin registers) or `href` (a path under
  `/dashboard`). Anything else is ignored.
- **Who sees it**: people with any of `permissions` (administrators see everything); no
  permissions means everyone who can open the admin.
- **Label**: `label_key` is a translation key from the plugin's `lang/` folder
  (`<slug>::file.key`); `label` is the fallback.
- **Icon**: one of the icon names the content-type editor offers (`shopping-bag`,
  `mail`, `package`, ...); unknown names show a generic icon.
- Children show under the entry while one of its pages is open.

Other plugins can change the list with the `admin_menu` filter ([hooks](hooks.md)).

## Settings form

`settings` in `plugin.json` holds the defaults. Add `settings_schema` and the plugin's
settings page becomes a proper form, checked on the server when it is saved:

```json
"settings": { "recipient_email": "", "subject": "Contact request" },
"settings_schema": [
  { "key": "recipient_email", "type": "email", "label": "Send messages to",
    "label_key": "contact-form::settings.recipient", "help": "Leave empty to use the site's admin email." },
  { "key": "subject", "type": "text", "label": "Subject", "required": true }
]
```

Field types are the ones content types use for custom fields: `text`, `textarea`,
`number`, `url`, `email`, `date`, `toggle`, `select` (with `options`) and `image`.
`help_key` translates the help text like `label_key` does. Plugins without a schema keep
a plain key/value editor. A plugin with a screen of its own (like the shop's settings)
doesn't need either.

## Requirements

A plugin declares what it needs in `plugin.json`:

```json
{
  "requires": {
    "core": ">=1.2",
    "php": ">=8.2",
    "plugins": { "modulo-shop": ">=1.1" }
  }
}
```

Each constraint names a minimum (`>=1.2`, `^1.2` and `1.2` all mean 1.2 or newer). The
older top-level `min_core_version` still works. They are enforced:

- **on install and update** — a registry release whose `latest` block declares
  `requires` (or `min_core_version`) the site does not meet is refused before anything
  is downloaded; the package's own `plugin.json` is checked again before it is moved
  into place.
- **on activation** — a plugin whose requirements are not met, including required
  plugins that are missing, too old or switched off, cannot be activated. The admin
  shows what is missing and disables the switch.
- **on deactivation and uninstall** — a plugin that an active plugin requires cannot be
  switched off or removed until its dependents are.

## Lifecycle hooks

A plugin's service provider (extending `App\Plugins\BasePluginServiceProvider`) can
override:

| Hook | When |
|---|---|
| `onActivate()` | After migrations and seeder ran on activation. Throwing undoes the activation and shows the message. |
| `onDeactivate()` | When switched off. Data stays. |
| `onUpgrade(string $from, string $to)` | After a newer version's migrations ran. |
| `onUninstall(bool $deleteData)` | Before removal. With `$deleteData`, the plugin's migrations are rolled back afterwards. |

Hooks run on a fresh, unbooted instance of the provider: use `$this->app`, not state
set up in `boot()`. Seeders still run on every activation and must be idempotent.

## Uninstalling

`plugin:activate <slug> --off` deactivates; uninstalling from the admin removes the
database row and records the decision in `storage/app/plugins/uninstalled/`. The
uninstall dialog offers **Also delete its data**, which rolls back every migration the
plugin shipped (`migrate:reset` on its `migrations_path`), dropping its tables.

That record is deliberately **outside** the plugin's directory. A marker written
inside the package is destroyed the moment those files are replaced by an update,
which silently resurrects a plugin the operator removed. Files are never deleted
automatically.

## Registry format

```json
{
  "schema": 1,
  "plugins": [
    {
      "slug": "contact-form",
      "namespace": "ContactForm",
      "name": "Contact Form",
      "description": "Shown in Browse registry",
      "author": "Modulo CMS",
      "homepage": "https://github.com/owner/repo",
      "latest": {
        "version": "1.2.0",
        "min_core_version": "1.0.0",
        "requires": { "plugins": { "modulo-shop": ">=1.1" } },
        "asset_url": "https://github.com/owner/repo/releases/download/v1.2.0/contact-form-1.2.0.zip",
        "sha256": "..."
      }
    }
  ]
}
```

Point `MODULO_PLUGIN_REGISTRY` at your own index to run a private one. Entries
missing a checksum, or pointing at a host that is not allowlisted, are dropped from
the listing rather than offered and then refused. `min_core_version` is checked
against the running core — and always passes on a development build, because
`0.0.0-dev` would otherwise fail every constraint.
