# Giving a plugin a React interface

A plugin can render its own React pages, loaded at runtime, without the core
being rebuilt.

## Why it works this way

Inertia resolves page components through `import.meta.glob`, which Rollup expands
**at build time**. A plugin installed after the core was built has no chunk in that
graph and can never contribute a page through it. Rebuilding the core on the server
is not an option either: the production image ships no Node and no `node_modules`,
by design.

So a plugin brings its own bundle and registers what it provides at runtime.

## The contract

The core publishes `window.Modulo` before any plugin loads (runtime contract
`1.2.0`):

```ts
window.Modulo = {
  version: '1.2.0',
  vendor: { react, reactDOM, jsxRuntime, inertia },
  ui,            // the admin kit, set before the first plugin bundle loads
  registerComponents(slug, components),
  getComponent(slug, name),
  registered(),
}
```

**Your plugin must not bundle its own React.** Two copies of React means two
independent hook dispatchers, and your components will crash the moment they call a
hook. A plugin bundle therefore leaves `react`, `react-dom`, `react/jsx-runtime` and
`@inertiajs/react` as bare imports, and every page carries an **import map** that
points those names at shims in `public/modulo-sdk/`, which re-export the core's own
instances from `window.Modulo.vendor`.

(An earlier version of this page mapped them with Rollup `output.globals`. That option
only applies to IIFE/UMD builds; an ES bundle kept `import 'react'`, which a browser
cannot resolve, so that recipe never worked.)

## Building a plugin bundle

Use the preset in `packages/plugin-sdk` (`@modulo/plugin-sdk`):

```js
// vite.config.js in your plugin
import react from '@vitejs/plugin-react';
import { moduloPlugin } from '@modulo/plugin-sdk';

export default moduloPlugin({ plugins: [react()] });
// options: entry (default resources/js/index.tsx), outDir (default resources/dist)
```

It builds `resources/dist/plugin.js` as an ES module with the shared imports left
external. Until the package is published, depend on it by path
(`"@modulo/plugin-sdk": "file:../../packages/plugin-sdk"` from a plugin inside the
repository). Its `runtime.d.ts` types `window.Modulo`.

`resources/js/index.tsx`:

```tsx
import Orders from './screens/Orders';
import Settings from './screens/Settings';

window.Modulo!.registerComponents('my-plugin', {
    Orders,
    // Lazy entries are declared as { load }, not as a bare function. A function
    // component and a thunk returning one are both `typeof 'function'` and
    // cannot be told apart; calling the wrong one runs your component outside
    // a render and fails with "invalid hook call".
    Reports: { load: () => import('./screens/Reports') },
});
```

Build it, and commit or release `resources/dist/plugin.js`. `plugin:publish-assets`
copies it to `public/plugins/<slug>/`, which is a shared volume in production
because the nginx image bakes `public/` in at build time.

## Rendering one

From PHP:

```php
return Inertia::render('Plugins/my-plugin/Orders', [
    'orders' => $orders,
]);
```

The core sees the `Plugins/` prefix, loads `/plugins/my-plugin/plugin.js` once, and
takes `Orders` from what the plugin registered. Props arrive exactly as they would
for a core page.

The slug is validated against `^[a-z0-9-]+$` and the URL is built from it rather than
taken from the page props, so a crafted response cannot point the loader at an
arbitrary script.

## Server-side rendering

Plugin components are **client-only**. Their bundle is fetched over HTTP and registers
itself on `window`; the SSR renderer has neither. SSR renders nothing for them and the
client fills them in on hydration, rather than failing the whole page.

If a page must be server-rendered, keep it in the theme or the core.

## Keeping the shims current

The shims are generated from the installed packages' real export lists:

```bash
npm run build:shims
```

Run it after upgrading React, ReactDOM or Inertia. `resources/js/plugin-sdk.test.ts`
fails when a shim is missing an export, so a dependency bump cannot silently break
plugins that import a new API.

## The admin kit: `@modulo/ui`

Admin screens should look and behave like the rest of the admin, so the core hands its
building blocks to plugins (runtime contract `1.2.0`):

```tsx
import { Button, Card, CardContent, Input, Label, SectionWrapper, useAdminToast, useTranslation } from '@modulo/ui';
```

Buttons, badges, cards, checkboxes, dialogs, dropdown menus, inputs, labels, selects,
switches, tables, tabs, textareas and tooltips; `SectionWrapper`, `SectionHeader`,
`EmptyState`, `AdminLayout`, `MediaPickerDialog` and `CustomFieldInputs`; the hooks
`useTranslation`, `useAdminToast` and `useAcl`, and `cn`. The full list is
`resources/js/plugin-ui.ts`; types are in the SDK (`ui.d.ts`). Names are only ever
added, so a plugin built against an older kit keeps working.

Like React, `@modulo/ui` stays a bare import in the bundle (the SDK preset marks it
external) and the page's import map points it at the core's copy.

A plugin screen rendered under `/dashboard` gets the admin frame (sidebar, header,
toasts) automatically; give the component a `layout` of your own to opt out.

## Styling

The core's Tailwind build only sees the core's own source, so a plugin brings the
utilities its screens use. Build them with Tailwind in the plugin (utilities only: the
core already provides the base styles) and map the core's design tokens, so
`bg-primary` or `text-muted-foreground` follow the site's theme and dark mode:

```css
/* resources/css/plugin.css, imported from resources/js/index.tsx */
@import 'tailwindcss/theme' layer(theme);
@import 'tailwindcss/utilities' layer(utilities);
@custom-variant dark (&:is(.dark *));
@theme {
    --color-primary: var(--primary);
    /* ...the rest of the @theme block in the core's resources/css/app.css */
}
```

A library build writes the CSS next to the bundle (`build.lib.cssFileName: 'plugin'`)
but doesn't load it; link it from the bundle:

```ts
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = new URL('./plugin.css', import.meta.url).href;
document.head.appendChild(link);
```

The shop plugin (`PhantomPixelDev/modulo-plugin-shop`) is a complete example.
