# Modulo CMS - Docker Development

## Quick Start

```bash
cd docker-dev
docker compose up -d --build
```

Then open **http://localhost:8000**

## What's Running

- **nginx** on port 8000 (serves the app)
- **PHP-FPM** (Laravel app)
- **PostgreSQL** (database)
- **Vite** (builds assets, exposed on 5174)
- **Mailpit** (email testing on 8025)

## Asset Building

After code changes to JS/CSS:

```bash
docker compose exec vite npm run build
```

If you ever see a white page or asset errors:

```bash
rm -f public/hot
docker compose exec vite npm run build
```

## No Traefik

This setup uses nginx directly (no reverse proxy). It's simpler and just works.

## Ports

- 8000: App (nginx)
- 5174: Vite dev server (if needed)
- 8025: Mailpit UI
- 1025: Mailpit SMTP
