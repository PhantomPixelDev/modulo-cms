# Themes

Themes define frontend presentation and user-facing UI behavior.

## How themes are loaded

The application registers a Blade namespace for theme resources from `resources/themes`.

## Defaults

`DEFAULT_THEME` in environment configuration controls default selection.

## Typical theme responsibilities

- page/post templates
- shared layout components
- localized UI strings
- visual styles and frontend behavior

## Best practices

- Keep theme logic presentation-focused.
- Avoid embedding domain/business rules in templates.
- Maintain locale key parity for translated themes.

## Related docs

- [Content Model](./content-model.md)
- [Configuration and Environment](../01-getting-started/configuration-and-env.md)
