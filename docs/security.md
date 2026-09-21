# Security

For reporting a vulnerability, see [../SECURITY.md](../SECURITY.md). This is
about running the thing safely.

## The short list

- **Never seed demo content on a live site.** Those accounts have passwords
  published in the README. `modulo:seed-demo` refuses production without
  `--force`, and the installer leaves the box unchecked.
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
- **No rate limiting on the installer.** It is unreachable once a user exists,
  which is the actual protection.
- **No 2FA.**
- **No audit log** of administrator actions.

## Dependencies

CI fails on known advisories in locked dependencies, on every push:

```bash
composer audit
npm audit --audit-level=high
```

Dependabot raises updates weekly. Majors are grouped by toolchain, because
packages with peer dependencies on each other cannot be upgraded one at a time.
