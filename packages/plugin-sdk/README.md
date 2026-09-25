# @modulo/plugin-sdk

Build a Modulo CMS plugin's React pages so they load at runtime, without the core
being rebuilt. See `docs/plugin-frontend.md` in the Modulo repository for the whole
story.

```js
// vite.config.js
import react from '@vitejs/plugin-react';
import { moduloPlugin } from '@modulo/plugin-sdk';

export default moduloPlugin({ plugins: [react()] });
```

```tsx
// resources/js/index.tsx
import Orders from './screens/Orders';

window.Modulo!.registerComponents('my-plugin', {
    Orders,
    Reports: { load: () => import('./screens/Reports') },
});
```

`npm run build` writes `resources/dist/plugin.js`. React, ReactDOM, the JSX runtime
and `@inertiajs/react` stay as imports; the core maps them to its own copies
(runtime contract 1.1.0 or newer).
