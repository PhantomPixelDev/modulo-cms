# Installation

Three ways in. Pick one.

Normal installations keep `MODULO_DEMO=false` (the default). The bundled homepage
shows your site's identity and published articles; a configured front page takes
precedence. Set `MODULO_DEMO=true` only for a disposable public demo to enable CMS
promotion and documented demo credentials. Production demo seeding additionally
requires the explicit `php artisan modulo:seed-demo --force` command.

Run the scheduler and a queue worker for scheduled publication, recovery pruning
and asynchronous jobs. Dashboard diagnostics show missing or stale heartbeats
after three minutes; synchronous queues report inline processing. `/health`
checks web readiness independently of those background services. Docker uptime
comes from the application container's startup timestamp; other installations
show Unavailable when no reliable timestamp exists.

## Docker, with the installer script

For a Linux server, install Docker Engine with the Docker Compose plugin, or Podman
with a working Compose provider. The runtime must be running and accessible to
your shell user. The installer also needs Bash, `curl`, `tar`, and OpenSSL. The
production images include the application and its built assets, so you do not
need PHP, Composer, Node.js, PostgreSQL, or Redis installed separately on the host.

```bash
curl -fsSLO https://raw.githubusercontent.com/PhantomPixelDev/modulo-cms/main/install.sh
less install.sh          # read it before running it
APP_URL=https://cms.example.com bash install.sh
```

Replace the example URL with your public site address. Put an HTTPS reverse proxy
in front of the web container's HTTP port (8080 by default), then open your public
URL at `/install`. The printed `localhost` address refers to the machine running
the installer. For a local trial, `bash install.sh` uses `http://localhost:8080`;
the production template uses secure session cookies, so use HTTPS or explicitly
disable secure cookies only for local HTTP testing.

For Windows installations, download `install.ps1` and run `.\install.ps1` with a
working Docker or Podman runtime and Compose provider.

It checks prerequisites and the port, downloads the compose file and env
template pinned to a published release, generates a unique `APP_KEY` and
database password with `openssl`, starts the stack, and prints the URL to
finish setup. It only writes inside the directory it creates.

That directory holds `docker-compose.yml` and a `.env` with your secrets. Compose reads
`.env` by itself, so plain `docker compose pull`, `up -d`, `logs` and `exec` work there
without extra flags. Keep `.env`; it is the only copy of your `APP_KEY`.

Documented as download-then-run rather than `curl | sh` on purpose: piping a
script from the internet into a shell means running code you have not read.

Options: `WEB_PORT=8081`, `MODULO_DIR=my-site`, `MODULO_TAG=1.2.3`.

## Docker, by hand

```bash
cp .env.prod.example .env.prod
# Required: APP_KEY, DB_PASSWORD, APP_URL
docker run --rm php:8.4-cli php -r "echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;"
./modulo.sh up prod
```

The production site is served on `WEB_PORT`, **default 8080** — not 8000 like
the dev stack. `MODULO_TAG` selects the release; `latest` follows the newest
non-prerelease.

No release published yet? There is nothing to pull, so build locally:

```bash
MODULO_BUILD=1 ./modulo.sh up prod
```

## Bare metal, from the release tarball

The tarball ships `vendor/` and `public/build` **already built**, so you need
neither Composer nor Node on the server.

```bash
curl -fsSLO https://github.com/PhantomPixelDev/modulo-cms/releases/latest/download/modulo-cms-<version>.tar.gz
curl -fsSLO https://github.com/PhantomPixelDev/modulo-cms/releases/latest/download/modulo-cms-<version>.tar.gz.sha256
sha256sum -c modulo-cms-<version>.tar.gz.sha256
tar -xzf modulo-cms-<version>.tar.gz
cd modulo-cms-<version>
cp .env.prod.example .env
php artisan key:generate
```

Requirements: PHP 8.4 with `pdo_pgsql`, `gd`, `exif`, `bcmath`, `zip`, `intl`,
`mbstring` and `openssl`; PostgreSQL 16; a web server with its document root at
`public/`.

**Only `public/index.php` may execute PHP.** Uploads land under `storage/`, and
a `.php` file there must never run. The shipped nginx config does this with:

```nginx
location ~ \.php$ { return 404; }
location = /index.php { include fastcgi_params; fastcgi_pass ...; }
```

Carry that rule into whatever server you use.

## Finishing setup

Whichever route you took, visit `/install`. The wizard checks requirements,
creates the tables, takes an administrator account and your site name, then
closes itself permanently — it returns 404 afterwards.

Headless instead:

```bash
php artisan modulo:install --no-interaction \
  --admin-name="Admin" --admin-email=admin@example.com \
  --admin-password="a-long-password" --site-name="My Site"
```

Both run the same code.

**Demo content is off by default** and should stay off on a real site: it
creates accounts whose passwords are published in the README. `modulo:seed-demo`
refuses to run in production without both `MODULO_DEMO=true` and `--force`.

## After installing

- Put TLS in front. The `web` container speaks plain HTTP by design; terminate
  with Caddy, Traefik, nginx or a load balancer and set `APP_URL` to the
  `https://` address.
- Read [security.md](security.md).
- Set up backups — `modulo:db-backup` runs nightly, but a backup you have never
  restored is a hope, not a plan. See [backup-restore.md](backup-restore.md).
