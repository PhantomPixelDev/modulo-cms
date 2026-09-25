# Building a theme

A theme provides the React components the public site renders. There is one
bundled theme, `modern-react`, and it is the reference.

```bash
php artisan theme:make "My Theme"     # scaffold
php artisan theme:list                # what exists
php artisan theme:install my-theme --activate
php artisan theme:publish-assets my-theme
```

## Layout

```
resources/themes/my-theme/
  theme.json
  components/
    Layout.tsx  Index.tsx  Post.tsx  Page.tsx  Archive.tsx  Search.tsx  NotFound.tsx
    partials/   Navigation.tsx  Footer.tsx  ...
  assets/css/theme.css
  lang/en.json
```

`theme.json` declares the components each template maps to:

```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "version": "1.0.0",
  "template_engine": "react",
  "templates": {
    "layout": { "component": "components/Layout.tsx" },
    "index":  { "component": "components/Index.tsx" },
    "post":   { "component": "components/Post.tsx" }
  }
}
```

Every file named in `templates` must exist, or installation is refused with the
missing path. `version` must be semver; prereleases like `1.0.0-beta.1` are
accepted.

## How a component is found

`ReactTemplateRenderer` turns a theme slug and template into an Inertia name —
`modern-react` + `components/Post.tsx` becomes `Themes/ModernReact/Post` — and
`resources/js/app.tsx` resolves it from a glob over `resources/themes`.

**That glob is expanded by Rollup at build time.** A theme added to the
directory after `npm run build` has no chunk, and every page that uses it fails
to resolve.

So: **after adding or changing a theme, rebuild.**

```bash
npm run build
```

This is also why themes *with their own components* ship with the core. The
production image contains no Node, so it cannot rebuild. What can be installed
at runtime is a **child theme** (below).

## Child themes

A child theme names a `parent` and restyles it: its own stylesheets, colours,
screenshots, fonts and strings, over the parent's components.

```
my-child/
  theme.json
  assets/css/style.css
  assets/screenshot.png
  lang/en.json          # only the strings it changes
```

```json
{
  "name": "Ocean",
  "slug": "ocean",
  "version": "1.0.0",
  "parent": "modern-react",
  "styles": ["assets/css/style.css"],
  "colors": { "primary": "oklch(0.55 0.15 230)" }
}
```

- **Components** come from the child when it ships the file (a bundled child theme
  under `resources/themes`, built with the site), otherwise from the parent, up the
  chain. `templates` may be omitted.
- **Styles** listed in `styles` (only `assets/…*.css`) are published and linked after
  the parent's, so the child's rules win. The design tokens in the parent's
  `theme.css` (`--primary`, `--radius`, `--background`, …) are the intended hooks.
- **`colors.primary`** overrides the brand colour without any CSS.
- **Strings** from the child's `lang/<locale>.json` override the parent's key by key.

The parent must be installed first, and cannot be uninstalled while a child builds on
it.

### Installing from the registry

**Themes → Browse registry** lists the registry's `themes` (same index as plugins, see
[plugins.md](plugins.md#registry-format)) and installs one with a click. The package
is downloaded over HTTPS from an allowlisted host and checked against the registry's
sha256, like a plugin. Then:

- only child themes are accepted;
- only `json`, `css`, `map`, images, fonts, `md`/`txt` and `LICENSE`/`README` files
  may be in it — PHP, JavaScript and React components are refused, so a theme can
  never run code on the server;
- it is unpacked into `storage/app/themes/<slug>` (`MODULO_THEME_INSTALL_PATH`), which
  lives on the persistent storage volume, and its assets are published to
  `public/themes/<slug>` (the shared `theme_assets` volume in Docker).

Registry theme updates show on **System → Updates**. Uninstalling a runtime theme
removes its files.

## Styling

Tailwind is compiled from the core's own sources, and its scan covers
`resources/`, so classes used in a theme under `resources/themes` are picked
up. A stylesheet listed in `theme.json` under `styles` (a path under `assets/`)
is published to `public/themes/<slug>/` and linked by the Layout. A registry
entry for a theme looks like a plugin's, plus `parent` and an optional
`screenshot` URL:

```json
{
  "themes": [{
    "slug": "ocean", "name": "Ocean", "parent": "modern-react",
    "screenshot": "https://…/ocean.png",
    "latest": { "version": "1.0.0", "asset_url": "https://github.com/…/ocean.zip", "sha256": "…" }
  }]
}
```

## Activating

Only React themes can be activated; `activateTheme()` refuses anything else.
Activation deactivates the previous theme in a transaction, publishes assets
and clears the theme cache.

If no theme is active the site renders a setup notice rather than failing. The
production entrypoint runs `theme:ensure` on boot, which installs and activates
the default theme only when none is active — it never overrides your choice.
