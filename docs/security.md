# Security

For reporting a vulnerability, see the [security policy](https://github.com/PhantomPixelDev/modulo-cms/blob/main/.github/SECURITY.md). This is
about running the thing safely.

## The short list

- **Never seed demo content on a live site.** Those accounts have passwords
  published in the README. `modulo:seed-demo` refuses production without
  both `MODULO_DEMO=true` and `--force`, and the installer leaves the box unchecked.
- **Unique `APP_KEY` per install.** It encrypts sessions and cookies. Never
  copy one between environments.
- **`APP_DEBUG=false`, `APP_ENV=production`.** Debug mode exposes configuration
  and stack traces.
- **Terminate TLS in front.** The `web` container is plain HTTP by design. Set
  `APP_URL` to the `https://` address so signed URLs and password-reset links
  are generated correctly.
- **Treat `install plugins` as shell access.** A plugin is arbitrary PHP running
  as the application. It is not sandboxed and cannot be.

## What is already hardened

Worth knowing so you do not re-solve it:

- **Only `/index.php` executes PHP.** A `.php` file anywhere else — including an
  uploaded one under `/storage` — returns 404. Carry this into any web server
  config you write yourself.
- **Dotfiles are not served**, so `.env` is not readable over HTTP.
- **Post content is sanitised server-side** before rendering, so an editor
  cannot plant a script that runs for an administrator.
- **Uploads are checked by extension as well as MIME type** and stored under a
  generated filename.
- **Privilege escalation is blocked**: a non-super-admin cannot edit the
  `super-admin` role, rename system roles, or grant permissions they do not
  already hold.
- **Guest orders need an unguessable token**, not just an order number.
- **Sessions are invalidated elsewhere when a password changes.**
- **Plugin packages are checksum-verified** against the registry before
  extraction, and extraction refuses traversal entries, symlinks, oversized
  archives and unexpected file types. See [plugins.md](plugins.md).

## What is not covered

Said plainly, because the gap matters more than the list above:

- **Plugin packages are checksum-verified, not signed.** The registry is the
  only authority; whoever controls it controls what installs.
- Packages contain executable trusted code. Checksum verification does not
  establish that a publisher's code is safe; install extensions you trust.

Container scans retain distribution advisories even when no stable package fix
exists. In particular, Debian currently lists [CVE-2026-6653 in libxml2](https://security-tracker.debian.org/tracker/CVE-2026-6653)
as a postponed parser denial-of-service issue. SVG uploads accept UTF-8 only and
reject DTD/entity declarations before XML parsing, limiting exposure to that
internal-subset parser path. This mitigation does not mean the underlying package
is patched. Upgrade base images when Debian publishes fixes; CI retains the full
report and gates every fixable high/critical finding.

## Public demos and setup

`MODULO_DEMO=true` restricts server administration even for the shared super-admin
account. Visitors can edit content, products, and media. Backup administration,
extension installation/removal, users/roles, credentials, API tokens, and mail or
payment configuration are blocked on the server. Operators use private CLI access.

The web installer requires a one-time token from `php artisan modulo:install-token`.
Only its SHA-256 hash is stored. Tokens expire after one hour, are claimed by one
session, and disappear when setup finishes. `--rotate` replaces a lost or expired
claim. Setup and first-administrator creation are serialized using locks on the
shared storage volume. Replicas must share that volume during setup.

Core and plugin admin routes use the `admin.access` middleware group. Older plugin
routes beneath `/dashboard` also receive mandatory two-factor enrollment checks.
When required, administrator API tokens are refused until their owner enrolls.
Setup, login, logout, and two-factor recovery stay accessible.

Publication permissions cover scheduling and publication-date changes, including
date-only API updates. Editing the text of an already-public item remains allowed
with its edit permission. Backup upload, restore, and download require a recently
confirmed password on normal installations. Package downloads validate every
redirect and pin public DNS answers; downloads and archive expansion are bounded.

## Dependencies

CI fails on known advisories in locked dependencies, on every push:

```bash
composer audit
npm audit --audit-level=high
```

Dependabot raises updates weekly. Majors are grouped by toolchain, because
packages with peer dependencies on each other cannot be upgraded one at a time.

## Security headers

The application sends these on every web response, so a bare-metal or tarball
install is covered without web server configuration:

| Header                       | Value                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| `X-Content-Type-Options`     | `nosniff`                                                     |
| `X-Frame-Options`            | `SAMEORIGIN`                                                  |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                             |
| `Permissions-Policy`         | camera, microphone, geolocation off                           |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                 |
| `Strict-Transport-Security`  | on HTTPS responses, 180 days (`MODULO_HSTS_MAX_AGE`, 0 = off) |

**Content-Security-Policy** is nonce-based: every inline script the core emits (Ziggy
routes, the plugin import map, Google Tag Manager/Analytics) carries a per-request
nonce, and `'strict-dynamic'` trusts what those load (Vite chunks, plugin bundles).
`MODULO_CSP` is `report` by default — violations only appear in the browser console —
so you can check your site with your plugins and embeds, then set it to `enforce`.
Add sources per directive with `MODULO_CSP_SCRIPT_SRC`, `MODULO_CSP_IMG_SRC`,
`MODULO_CSP_CONNECT_SRC`, `MODULO_CSP_FRAME_SRC`, `MODULO_CSP_STYLE_SRC`,
`MODULO_CSP_FONT_SRC` (space-separated). `MODULO_SECURITY_HEADERS=false` turns all of
this off, for when a proxy in front sets them.

## Passwords

In production every password rule (registration, reset, change, installer, admin user
form) requires at least 12 characters (`MODULO_PASSWORD_MIN_LENGTH`) with letters and
numbers, and rejects passwords found in known breaches via the Have I Been Pwned range
API (`MODULO_PASSWORD_UNCOMPROMISED=false` to skip; only the first five characters of
the password's SHA-1 leave the server).

## Two-factor authentication

Every user can turn on authenticator-app codes under **Settings → Two-factor
authentication**: scan the QR code, confirm with a code, save the eight recovery codes.
Turning it on, off, or regenerating recovery codes asks for the password again.

At login, a correct password for such an account does not sign in; the user is asked
for a code (or a recovery code, each usable once). Codes are standard TOTP (RFC 6238,
SHA-1, 6 digits, 30 s, one step of clock drift), a code is never accepted twice, and the
challenge locks for a minute after five wrong codes. Secrets and recovery codes are
stored encrypted with `APP_KEY`.

`MODULO_REQUIRE_2FA_FOR_ADMINS=true` sends users with the `admin` or `super-admin` role
to set it up before they can use the dashboard or admin area, and stops them turning it
off.

A user who has lost both their device and recovery codes can be reset by an operator:

```bash
php artisan tinker --execute="App\\Models\\User::where('email', 'someone@example.com')->first()->forceFill(['two_factor_secret' => null, 'two_factor_confirmed_at' => null, 'two_factor_recovery_codes' => null])->save();"
```

## Activity log

**Settings → Activity** (administrators only) is the audit trail: sign-ins, failed and
locked-out sign-ins, wrong two-factor codes, password resets; creating, changing and
deleting posts, pages, users, roles, post types, taxonomies and menus; role and
permission assignments; settings saved; plugins and themes installed, activated,
updated and removed; two-factor turned on or off; backups created, downloaded, deleted
and restored; and core upgrades. Each entry records who, when, the IP address and user
agent, and what changed (attribute names, never values of passwords, tokens or 2FA
secrets). Filter by area, by user, or search descriptions.

Entries older than `MODULO_ACTIVITY_RETENTION_DAYS` (180) are pruned daily at 04:30
(`php artisan model:prune --model="App\Models\Activity"`); `0` keeps everything.
Plugins can add their own entries:

```php
App\Support\ActivityLog::record('my-plugin.exported', 'Exported 120 orders', $model, ['format' => 'csv']);
```
