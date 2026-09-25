# Headless API (v1)

Modulo serves its content as JSON under `/api/v1`, for a separate front end (Next.js,
Astro, a mobile app) or integrations. The machine-readable description is at
**`/api/v1/openapi.json`** (OpenAPI 3.1); a test fails if a route is missing from it.

## Access

- **Published content is public.** No token is needed to read published posts and pages,
  post types, taxonomies, menus or site settings.
- **A token acts as its user.** Create one under **Settings → API tokens** (your password
  is asked for). It is shown once; only its SHA-256 is stored. Tokens can expire (7, 30,
  90, 365 days or never), show when they were last used, and can be revoked there.
- **Abilities limit a token further**: `read` (with a user who may view posts, also drafts,
  private and scheduled content via `?status=`) and `write` (create, change and trash —
  still only what the user's permissions allow).

```bash
curl -H "Authorization: Bearer mod_…" https://example.com/api/v1/posts?status=draft
```

A wrong or expired token gets `401` even on public endpoints, so a broken client finds out
instead of silently seeing less. Requests are limited to `MODULO_API_RATE_LIMIT` (120)
per minute per token, or per IP without one; the `X-RateLimit-*` headers say where you are.

## Endpoints

| Method | Path | |
|---|---|---|
| GET | `/site` | Name, tagline, URL, logo, favicon, default description, social links |
| GET | `/post-types` | Public post types |
| GET | `/taxonomies`, `/taxonomies/{slug}/terms` | Public taxonomies and their terms |
| GET | `/menus/{location}` | Menu items at a location (`header`, `footer`) or with that slug |
| GET | `/posts` | Posts, paginated. `type`, `term`, `search`, `status`, `sort` (`-published_at`, `title`, …), `per_page` (≤ 100) |
| GET | `/posts/{slug}` | One post, with rendered `content` |
| GET | `/pages`, `/pages/{slug}` | The same for pages |
| POST | `/posts` | Create (`write`). `type` picks the post type; a future `published_at` schedules it |
| PATCH | `/posts/{id}` | Change a post or page (`write`) |
| DELETE | `/posts/{id}` | Move to the trash (`write`) |

A post looks like:

```json
{
  "id": 12, "type": "post", "title": "Hello", "slug": "hello",
  "url": "https://example.com/posts/hello", "status": "published",
  "excerpt": "…", "content": "<p>…</p>",
  "featured_image": "/storage/…", "published_at": "2026-09-25T08:00:00+00:00",
  "author": { "id": 1, "name": "Ada" },
  "terms": [{ "id": 3, "name": "News", "slug": "news", "taxonomy": "category" }],
  "seo": { "title": "Hello", "description": "…", "noindex": false }
}
```

`content` (rendered HTML: shortcodes applied, sanitized) is only in single-item responses.
Listings are Laravel paginators: `data`, `links`, `meta`.

## Versioning

`v1` only changes in backwards-compatible ways: new endpoints, new optional parameters and
new fields may appear; nothing is removed or renamed. A breaking change would ship as
`/api/v2` alongside `v1`.
