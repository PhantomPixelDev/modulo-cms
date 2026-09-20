# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub's
[security advisory form](https://github.com/PhantomPixelDev/modulo-cms/security/advisories/new).
That creates a private thread visible only to the maintainers.

Please include the affected version, the install channel (Docker, tarball or git),
reproduction steps, and what an attacker gains. A proof of concept helps a great deal.

This is a small project maintained in spare time, so a fix may take a little while.
You will get an acknowledgement, and credit in the release notes unless you would
rather not be named.

## Supported versions

Until a 1.0 release, only the latest release receives security fixes.

## Deploying safely

Modulo is a self-hosted application; most of its security posture is your deployment.
The defaults that matter:

- **Never seed demo content into production.** `DemoContentSeeder` creates accounts with
  publicly documented passwords. The production entrypoint does not seed, and
  `modulo.sh seed` refuses a production environment without `--force`.
- **Set a unique `APP_KEY`.** It encrypts sessions and cookies. The installer generates
  one; do not copy a key between installs.
- **Keep `APP_DEBUG=false` and `APP_ENV=production`.** Debug mode exposes configuration
  and stack traces.
- **Terminate TLS in front of the stack.** The `web` container speaks plain HTTP by
  design; put Caddy, Traefik, nginx or a load balancer in front of it and set
  `APP_URL` to the `https://` address.
- **Restrict who can install plugins.** A plugin is arbitrary PHP running as the
  application. The `install plugins` permission should be held only by people you would
  trust with shell access to the server.
- **Back up before upgrading.** `modulo:upgrade` takes a database backup first, but a
  backup you have restored at least once is the only one that counts.

## What is already hardened

Worth knowing so you do not re-solve it:

- Post content is sanitised server-side before rendering, so an editor cannot plant a
  script that runs for an admin.
- Uploads are restricted by extension as well as MIME type and stored under a
  generated filename.
- Only `/index.php` is passed to PHP-FPM; a `.php` file anywhere else, including an
  uploaded one under `/storage`, is not executed.
- Dotfiles such as `.env` are not served.
- Non-super-admins cannot edit the `super-admin` role or grant themselves permissions
  they do not already hold.
