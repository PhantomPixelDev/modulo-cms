# Coding Standards

Follow existing code style and architecture conventions.

## General principles

- Keep fixes minimal and root-cause oriented.
- Prefer explicitness in security-sensitive logic.
- Avoid hidden behavior and broad side effects.

## Backend

- Follow Laravel conventions (controllers, middleware, services).
- Keep business logic out of routes where possible.
- Use middleware and rate limiting intentionally.

## Frontend/themes

- Keep UI logic separated from backend business rules.
- Maintain localization key parity across locales.

## Docs and maintainability

- Update docs when behavior/configuration changes.
- Add concise comments only where logic is non-obvious.

## Related docs

- [Testing Strategy](./testing-strategy.md)
- [Database Changes](./database-changes.md)
