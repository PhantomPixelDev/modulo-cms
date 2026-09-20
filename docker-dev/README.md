# Development stack

Use `./modulo.sh up dev` from the repository root rather than invoking Compose here
directly — the helper resolves the right compose file, env file and container runtime.

```bash
cp .env.dev.example .env.dev
./modulo.sh up dev
```

## Services

| Service | Container | Host port | Purpose |
|---|---|---|---|
| `web` | `modulo-dev-web` | 8000 | nginx; serves `public/` and proxies PHP and Vite |
| `app` | `modulo-dev-app` | — | PHP-FPM, bind-mounted from the repository |
| `vite` | `modulo-dev-vite` | 5174 | Vite dev server (reached through nginx on 8000) |
| `db` | `modulo-dev-db` | — | PostgreSQL 16 |
| `mailpit` | `modulo-dev-mailpit` | 8025 / 1025 | Captures outgoing mail |

`vendor/`, `storage/` and `node_modules/` are named volumes, so they are not affected by
the bind mount. Everything else is mounted live from the repository.

## First boot

`entrypoint.sh` does the setup, in this order: fixes storage permissions, symlinks
`.env` to `.env.dev`, generates an `APP_KEY` if that file has none, installs Composer
dependencies if `vendor/` is empty, waits for PostgreSQL, and then — **only when the
database is fresh, meaning there is no `migrations` table** — migrates and seeds. It
finishes by installing and activating the default theme if no theme is active.

The `RUN_MIGRATIONS` and `RUN_SEEDERS` toggles in `docker-compose.yml` control whether
those steps also run on *subsequent* boots. They default to `false`, which is why a
normal restart is fast. They do not suppress the fresh-database path.

The `APP_KEY` is written back into `.env.dev` on the host through the bind mount, and
also exported for this boot — php-fpm runs with `clear_env = no`, which matters because
Compose passes `.env.dev` into the container and Laravel's Dotenv never overrides a real
environment variable. Without the export, an empty `APP_KEY=` in the env file would
shadow the freshly generated one.

## Common tasks

```bash
./modulo.sh logs                  # follow all services
./modulo.sh shell                 # bash in the app container
./modulo.sh artisan migrate       # environment comes from MODULO_ENV, default dev
./modulo.sh bootstrap-dev         # rebuild from scratch — destroys dev volumes
```

## Troubleshooting

**Blank page on first load.** Vite is compiling. Tailwind's first pass over a bind mount
takes ~20s, and `app.tsx` imports the stylesheet before anything renders. It resolves
itself; subsequent loads are ~200ms. If it persists, check `./modulo.sh logs` for the
`vite` service.

**502 from nginx.** The app container is still starting, or was recreated. nginx
re-resolves the app address every 10 seconds, so this clears on its own within a few
seconds of the app becoming healthy.

**Everything is slow on Windows.** That is the bind mount, not the stack. See
[../docs/performance-windows.md](../docs/performance-windows.md).

**No TLS here.** The dev stack is plain HTTP on purpose.
