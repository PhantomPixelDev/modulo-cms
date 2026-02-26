# Taxonomies and Locales

This page covers classification and locale-aware routing behavior.

## Taxonomies

The CMS supports taxonomy archives for content grouping (for example categories and tags).

## Route bases

Taxonomy route bases are configurable via site settings:
- category base (default `category`)
- tag base (default `tag`)

Plural aliases are also supported where applicable.

## Locale routes

Locale-prefixed routes are available using 2-letter locale codes:
- `/{locale}/...`
- Example: `/es/posts/my-post`

Route middleware applies locale context for these requests.

## Considerations

- Avoid slug collisions with reserved and system paths.
- Keep localized slugs synchronized with translation content.

## Related docs

- [Content Model](./content-model.md)
- [Public Routes](../04-api/public-routes.md)
