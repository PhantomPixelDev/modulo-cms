/**
 * Vite config for a Modulo plugin bundle.
 *
 * The bundle is an ES module that leaves React, ReactDOM, the JSX runtime and
 * Inertia as bare imports. The core's page maps those to its own instances
 * with an import map, so the plugin never ships a second React (two Reacts
 * means two hook dispatchers, and every hook call crashes).
 *
 *   // vite.config.js in the plugin
 *   import react from '@vitejs/plugin-react';
 *   import { moduloPlugin } from '@modulo/plugin-sdk';
 *
 *   export default moduloPlugin({ plugins: [react()] });
 */

/** Imports the core provides at runtime; never bundled into a plugin. */
export const SHARED = ['react', 'react-dom', 'react/jsx-runtime', '@inertiajs/react', '@modulo/ui'];

/**
 * @param {object} [options]
 * @param {string} [options.entry] Entry file (default resources/js/index.tsx)
 * @param {string} [options.outDir] Output directory (default resources/dist)
 * @param {import('vite').PluginOption[]} [options.plugins] Vite plugins, e.g. react()
 * @returns {import('vite').UserConfig}
 */
export function moduloPlugin({ entry = 'resources/js/index.tsx', outDir = 'resources/dist', plugins = [] } = {}) {
    return {
        plugins,
        // Built for the browser: keep process.env out of the bundle.
        define: { 'process.env.NODE_ENV': JSON.stringify('production') },
        build: {
            outDir,
            emptyOutDir: true,
            lib: {
                entry,
                formats: ['es'],
                fileName: () => 'plugin.js',
            },
            rollupOptions: {
                external: (id) => SHARED.includes(id) || SHARED.some((shared) => id.startsWith(`${shared}/`)),
            },
        },
    };
}
