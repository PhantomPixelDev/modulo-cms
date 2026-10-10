# Theme settings

Open **Appearance → Theme settings** to change the active theme. You can also
open its settings from the active theme card under **Appearance → Themes**.
The account needs the existing **customize themes** permission.

Modern React includes light and dark palettes, system/Helvetica/Georgia/monospace
fonts, content width, corner style and the article sidebar. The sample preview
updates while you edit; switch it between light and dark. **Save settings** applies
the changes to public pages. **Discard changes** restores the current saved form.
**Reset to theme defaults** removes this theme’s saved choices after confirmation.

Settings belong to each theme and live in the database. Switching themes keeps
their choices, and upgrading or reinstalling a theme preserves them. Child themes
inherit available controls from their parent and may override their definitions.
An existing manifest `colors.primary` remains in use until a brand color is saved.
Admin colors are independent of public theme colors.

On the public demo, appearance changes are allowed and the four-hour clean reset
restores the baseline. Installing, removing and publishing theme assets remain
restricted. No rebuild or file write is needed to change settings.

## Declaring controls in a theme

Add a `settings` object to `theme.json`:

```json
{
    "settings": {
        "primary_color": {
            "type": "color",
            "group": "colors",
            "label": "Brand color",
            "default": "#2563eb"
        },
        "show_sidebar": {
            "type": "boolean",
            "group": "layout",
            "label": "Show article sidebar",
            "default": true
        },
        "container_width": {
            "type": "select",
            "group": "layout",
            "label": "Content width",
            "default": "standard",
            "options": { "compact": "Compact", "standard": "Standard", "wide": "Wide" }
        }
    }
}
```

Keys use lowercase letters, numbers and underscores, starting with a letter.
Supported types are `color` (six-digit hex), `select` (declared string choices)
and `boolean`. Groups are `colors`, `dark_colors` and `layout`. Defaults must
match the field type; invalid definitions are omitted. Undeclared submission
keys and invalid values are rejected on the server.

React templates receive resolved values in `theme.settings`. Custom controls
can be read there by theme components. Modern React recognizes `primary_color`,
`background_color`, `text_color`, `surface_color` and `border_color`; use the
`dark_` prefix for their dark equivalents. `font_family` accepts `system`,
`helvetica`, `serif` or `mono`; `container_width` accepts `compact`, `standard`
or `wide`; `corner_style` accepts `square`, `subtle`, `rounded` or `soft`.
`show_sidebar` controls article/listing sidebars. Button text automatically
uses a contrasting color. Custom themes must apply their settings in their own
layout, or reuse the shared `themeSettingsCss` helper and scoped container token.

Published installations need the forward migration before using these controls:
run the guarded `php artisan modulo:upgrade` as described in
[Upgrading](upgrading.md). The migration adds a nullable `themes.settings` JSON
column and does not alter existing themes or content.
