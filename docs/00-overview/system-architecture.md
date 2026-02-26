# System Architecture

This page describes the runtime architecture and main extension points in Modulo CMS.

## Runtime components

- **Web**: nginx (reverse proxy/static assets)
- **App**: php-fpm Laravel application
- **DB**: PostgreSQL
- **Cache/Queue**: Redis
- **Workers (prod)**: queue worker + scheduler services

## Request flow (web)

1. Request hits nginx.
2. nginx serves static assets or forwards PHP requests to app.
3. Laravel route layer resolves route and middleware.
4. Controller returns Inertia or HTTP response.

## Route architecture highlights

- Liveness/readiness routes: `/health`, `/ready`
- Public content routes (posts, pages, taxonomy archives)
- Locale-prefixed routes for translated navigation
- API prefixed menu endpoints under `/api/menus/*`

## Extension architecture

### Themes

- Theme templates/resources are loaded from `resources/themes` namespace.

### Plugins

- Plugins live under `plugins/<PluginName>`
- Manifest (`plugin.json`) defines slug/version/service provider.
- Plugin service providers extend a base provider and can load:
  - routes
  - migrations
  - translations
  - views

### Hooks

- Hook system is used by plugins (e.g., `add_action`, `add_filter`).
- App boot emits `cms_booted` hook after framework boot.

## Operational characteristics

- Environment model: `.env` (dev), `.env.production` (prod-local)
- Production app startup fails if `APP_KEY` is missing.
- Healthchecks and dependency checks support orchestration.

## Related docs

- [Configuration and Environment](../01-getting-started/configuration-and-env.md)
- [Plugin Development Guide](../03-plugins/plugin-development-guide.md)
- [Healthchecks and Observability](../05-operations/healthchecks-and-observability.md)
