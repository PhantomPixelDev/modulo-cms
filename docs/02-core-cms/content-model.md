# Content Model

This page describes how content is structured in Modulo CMS.

## Core entities

- **Post types** define a content class (post/page/product/etc.).
- **Posts** store publishable content records.
- **Post translations** store locale-specific fields.
- **Menus/menu items** represent navigation.
- **Site settings** provide configurable platform values.

## Modeling principles

- Use explicit schema constraints and keys.
- Keep JSON handling centralized via model casts.
- Keep migration changes scoped and reversible when practical.

## Content lifecycle

1. Define or select a post type.
2. Create/edit content in admin.
3. Publish content with slug.
4. Deliver via web routes, optionally locale-prefixed.

## URL behavior

- `/posts/{slug}` for standard posts
- dynamic routes for post types
- top-level pages by slug where no reserved route conflict exists

## Related docs

- [Taxonomies and Locales](./taxonomies-and-locales.md)
- [Themes](./themes.md)
- [Database Architecture](../database-architecture.md)
