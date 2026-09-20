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

The core publishes `window.Modulo` before any plugin loads:

```ts
window.Modulo = {
  version: '1.0.0',
  vendor: { react, reactDOM, inertia },
  registerComponents(slug, components),
  getComponent(slug, name),
  registered(),
}
```

**Your plugin must not bundle its own React.** Two copies of React means two
independent hook dispatchers, and your components will crash the moment they call a
hook. Mark them external and map them onto the instances the core exposes — that is
what `vendor` is for.

## Building a plugin bundle

`vite.config.ts` in your plugin:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        lib: {
            entry: 'resources/js/index.tsx',
            formats: ['es'],
            fileName: () => 'plugin.js',
        },
        outDir: 'resources/dist',
        rollupOptions: {
            // Never bundle these; use the core's instances.
            external: ['react', 'react-dom', 'react/jsx-runtime', '@inertiajs/react'],
            output: {
                globals: {
                    react: 'window.Modulo.vendor.react',
                    'react-dom': 'window.Modulo.vendor.reactDOM',
                    '@inertiajs/react': 'window.Modulo.vendor.inertia',
                },
            },
        },
    },
});
```

`resources/js/index.tsx`:

```tsx
import Orders from './screens/Orders';
import Settings from './screens/Settings';

window.Modulo.registerComponents('my-plugin', {
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

## Styling

The core's Tailwind build scans the core's own source, so utility classes that appear
only in your plugin will not be in the compiled stylesheet. Either ship your own CSS
from the plugin bundle, or stay within the classes the core already uses.
