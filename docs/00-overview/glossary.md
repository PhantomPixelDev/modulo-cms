# Glossary

## Core terms

- **Post Type**: Content type definition (e.g., post, page, product).
- **Taxonomy**: Classification structure (e.g., categories, tags).
- **Theme**: Presentation layer resources/templates for frontend rendering.
- **Plugin**: Optional module that extends CMS behavior.
- **Slug**: URL-friendly identifier for content or taxonomy terms.
- **Locale route**: URL prefixed with locale code (e.g., `/es/...`).

## Operations terms

- **Liveness**: "Is process running?" endpoint (`/health`).
- **Readiness**: "Can app serve traffic now?" endpoint (`/ready`).
- **Queue worker**: Long-running process consuming async jobs.
- **Scheduler**: Process executing scheduled Laravel tasks.
- **Schema baseline**: Current canonical SQL schema snapshot (`database/schema/pgsql-schema.sql`).

## Development terms

- **modulo.sh**: Project helper script for docker/artisan workflows.
- **Inertia**: Server-driven SPA bridge used by React frontend.
- **Rate limiter**: Global or route-level request throttling policy.
