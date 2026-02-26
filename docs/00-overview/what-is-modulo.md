# What is Modulo CMS

Modulo CMS is a modular content management system built on Laravel 12 with a React 19 + Inertia frontend.

## Purpose

Modulo CMS provides a base CMS with:
- Post/page style content publishing
- Taxonomies, menus, comments, and media handling
- Theme support
- Pluggable feature extension system

## Audience

- Developers building CMS features
- Teams deploying CMS instances
- Plugin and theme authors

## Core stack

- Backend: Laravel 12 / PHP 8.4
- Frontend: React 19 + Inertia + Tailwind
- DB: PostgreSQL
- Infra: Docker-based dev and prod-local stacks

## High-level capabilities

- Locale-aware routing and content delivery
- Admin dashboard for content and system management
- Plugin lifecycle: discover, activate, configure, deactivate, uninstall
- Production readiness endpoints (`/health`, `/ready`)

## Related docs

- [System Architecture](./system-architecture.md)
- [Local Development](../01-getting-started/local-development.md)
- [Plugin Lifecycle](../03-plugins/plugin-lifecycle.md)
