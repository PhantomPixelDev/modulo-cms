# Database Architecture

This document defines how Modulo CMS data is organized and how schema evolution should happen safely.

## Domain map

### 1) Content domain
- `post_types`, `posts`, `taxonomy_terms`, `post_taxonomy_terms`, `comments`
- Translation tables:
  - `post_translations`
  - `taxonomy_translations`
  - `taxonomy_term_translations`

### 2) Navigation domain
- `menus`, `menu_items`
- Translation table:
  - `menu_item_translations`

### 3) Configuration domain
- `site_settings`, `sitemap_settings`
- Translation tables:
  - `site_setting_translations`
  - `sitemap_setting_translations`

### 4) Platform domain
- `themes`, `plugins`
- `users`, roles/permissions tables
- `locales`, `translation_overrides`

## Modeling rules

1. Use one source of truth for JSON fields.
   - Prefer Eloquent `$casts` for encode/decode.
   - Avoid duplicating JSON mutators unless custom transformation is required.

2. Keep parent-child FK types aligned.
   - Parent references should use the same id type as referenced PK (`bigint` in this project).

3. Make constraints explicit.
   - Add FK and unique constraints for relational integrity.
   - Add check constraints only for stable enum-like states.

4. Keep schema query-oriented.
   - Add indexes only for known read/query paths.
   - Avoid broad index sprawl without measured need.

## Evolution approach

- Historical migrations remain in repo for auditability.
- `database/schema/pgsql-schema.sql` is the baseline for fresh Postgres setups.
- New schema changes should be:
  - small,
  - reversible when practical,
  - domain-targeted.

## Current guardrails

- Dev helper commands:
  - `./modulo.sh migrate-status dev`
  - `./modulo.sh schema-dump dev`
- CI should run migration reproducibility checks (fresh migrate + seed).

## Next target improvements

1. Parent id consistency and self-referential constraints for hierarchical content tables.
2. Translation/model behavior deduplication via shared helpers.
3. Index cleanup pass based on real query patterns.
