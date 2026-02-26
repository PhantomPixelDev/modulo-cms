# Public Routes

This page summarizes key public-facing web routes.

## Health

- `GET /health` (liveness)
- `GET /ready` (dependency readiness)

## Content and discovery

- `GET /` home
- `GET /search` search (throttled)
- `GET /sitemap.xml`
- `GET /feed`
- `GET /robots.txt`

## Taxonomy archives

- `GET /{tagBase}/{slug}`
- `GET /{categoryBase}/{slug}`
- Optional plural aliases (`/tags/{slug}`, `/categories/{slug}`) when base differs.

## Posts and pages

- `GET /posts`
- `GET /posts/{slug}`
- `POST /posts/{post}/comments` (throttled)
- Dynamic post type routes and top-level page routes

## Locale-prefixed routes

- `GET /{locale}/...` for localized home, posts, and content routes.

## Notes

- Route collisions are protected by reserved slug configuration.
- Catch-all routes are intentionally ordered last.

## Related docs

- [Auth and Rate Limits](./auth-and-rate-limits.md)
- [Taxonomies and Locales](../02-core-cms/taxonomies-and-locales.md)
