# Plugins

## Installing

```bash
php artisan plugin:list --available          # what the registry offers
php artisan plugin:install contact-form      # download, verify, install
php artisan plugin:activate contact-form
php artisan plugin:list --updates            # what has a newer release
php artisan plugin:update --all
```

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

## Updating

`plugin:update` compares the registry's version with the installed one. New
migrations run **before** the version is recorded, so a failed migration leaves the
recorded version behind and the update is retried rather than assumed done. A package
older than what is installed is refused; rolling a plugin's schema backwards is not
something this can do safely.

## Docker

Two volumes matter:

- `plugins` — plugins installed at runtime live outside the image, or they would be
  discarded every time the image is replaced.
- `plugin_assets` — mounted read-only into the web container at
  `public/plugins`. The nginx image bakes `public/` in at build time, so anything
  written there at runtime is invisible to it otherwise.

A named volume is seeded from the image **once** and never refreshed, which would
freeze bundled plugins at whatever version first booted. The image therefore keeps a
pristine copy at `plugins-bundled/`, and on every boot `plugin:sync-bundled` copies a
bundled plugin over the volume **only when it is strictly newer** than what is there. A
plugin you updated from the registry is never rolled back to the image's older copy,
and plugins installed at runtime have their own directories and are untouched.

## Uninstalling

`plugin:activate <slug> --off` deactivates; uninstalling from the admin removes the
database row and records the decision in `storage/app/plugins/uninstalled/`.

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
      "latest": {
        "version": "1.2.0",
        "min_core_version": "1.0.0",
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
