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

This is also why themes ship with the core rather than being installed at
runtime the way plugins are. The production image contains no Node, so it
cannot rebuild, and a theme dropped onto a running server would not work. If
you need a genuinely runtime-loadable frontend, that is what the plugin runtime
is for — see [plugin-frontend.md](plugin-frontend.md).

## Styling

Tailwind is compiled from the core's own sources, and its scan covers
`resources/`, so classes used in a theme under `resources/themes` are picked
up. Theme CSS declared in `theme.json` under `assets` is published to
`public/themes/<slug>/` but **nothing currently emits a link tag for it**, so
prefer Tailwind classes until that is wired up.

## Activating

Only React themes can be activated; `activateTheme()` refuses anything else.
Activation deactivates the previous theme in a transaction, publishes assets
and clears the theme cache.

If no theme is active the site renders a setup notice rather than failing. The
production entrypoint runs `theme:ensure` on boot, which installs and activates
the default theme only when none is active — it never overrides your choice.
