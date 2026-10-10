# Theme settings

Open **Appearance → Theme settings** to change the active theme. You can also
open its settings from the active theme card under **Appearance → Themes**.
The account needs the existing **customize themes** permission.

Modern React includes light and dark palettes, system/Helvetica/Georgia/monospace
fonts, content width, corner style and the article sidebar. The sample preview
updates while you edit; switch it between light and dark. **Save settings** applies
the changes to public pages. **Discard changes** restores the current saved form.
**Reset to theme defaults** removes this theme’s saved choices after confirmation.

### Logo, header and footer

**Logo and branding** supports automatic branding, text only, an icon, or an image.
Choose logo images from the media library, or enter a local path / HTTP(S) URL.
Upload new files through **Content → Media** first. A separate dark-mode image is
optional. Set the mark height (16–80 px), text size (12–36 px), and whether text
appears beside the mark. Image-only links retain an accessible site name.
Blank logo text uses the site name; blank image uses the global site logo.
These theme overrides do not rename the site or change SEO page titles.

Header settings control sticky positioning, spacing, and the light/dark switch.
Footer settings control the logo, tagline, CMS credit, and copyright text.
Use `{year}` and `{site}` in copyright text; leave it blank for the standard footer.
The same branding appears in the header, footer, and public authentication pages.
Theme developers can reuse `ThemeBrand` for consistent rendering.
The media picker includes a folder selector for top-level and nested folders.
The upgrade also repairs older library seeds saved in the wrong media collection,
so their existing images become selectable without moving or deleting files.

**Clear website cache** refreshes public pages, content lookups, menus, theme
settings, and sitemap XML. It preserves sessions, locks, queues, health heartbeats,
and editor recovery. This scoped action is available with **customize themes**,
including on the public demo. Clearing cache does not save pending form changes.

### Page-cache settings

On normal installations, open **Settings → Site settings → Cache** to enable or
disable public page caching and set its lifetime (60–86,400 seconds). These writes
require **edit settings**. The public demo keeps global settings read-only.
`MODULO_PAGE_CACHE=false` is a server-level off switch that takes precedence;
`MODULO_PAGE_CACHE_TTL` supplies the default lifetime until one is saved.
Changing preferences invalidates existing website caches immediately.
Account, cart, checkout, signed preview, and authenticated responses are excluded.
The existing site-settings clear button now clears the scoped website caches too.

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
Supported types are `color` (six-digit hex), `select` (declared string choices),
`boolean`, `text` (up to 500 characters), `image` (local path or HTTP(S) URL), and
`number` (integer with declared `min` / `max`, bounded within 0–1000).
Text and image controls can default to an empty string. Groups are `branding`,
`header`, `footer`, `colors`, `dark_colors` and `layout`. Defaults must
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
