import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { route } from 'ziggy-js';
import type { SharedData } from './types';

const appName = import.meta.env.VITE_APP_NAME || 'Modulo CMS';

type PageModule = { default: ResolvedComponent };
const pages = import.meta.glob<PageModule>(['./pages/**/*.tsx', '!./pages/**/*.test.tsx'], { eager: false });
const themeComponents = import.meta.glob<PageModule>(['../themes/**/components/**/*.tsx', '!../themes/**/*.test.tsx'], { eager: false });

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => {
            const admin = /^\/(dashboard|settings)(\/|$)/.test(page.url);
            return !title ? appName : admin ? `${title} - ${appName}` : title;
        },
        resolve: (name) => {
            if (name.startsWith('Plugins/')) {
                // Plugin components are client-only: their bundle is fetched
                // over HTTP and registers itself on window, and this runs in
                // Node with neither. Render nothing and let hydration fill it
                // in, rather than failing the whole page.
                return Promise.resolve(() => null);
            }

            if (name.startsWith('Themes/')) {
                const parts = name.split('/');
                const themeNamePascal = parts[1];
                const componentPath = parts.slice(2).join('/');

                const themeSlug = themeNamePascal.replace(/([A-Z])/g, (match, p1, offset) => {
                    return offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase();
                });

                const themeComponentPath = `../themes/${themeSlug}/components/${componentPath}.tsx`;
                if (themeComponents[themeComponentPath]) {
                    return resolvePageComponent(themeComponentPath, themeComponents).then((module) => module.default);
                }

                const indexPath = `../themes/${themeSlug}/components/${componentPath}/index.tsx`;
                if (themeComponents[indexPath]) {
                    return resolvePageComponent(indexPath, themeComponents).then((module) => module.default);
                }
            }

            const possiblePaths = [
                `./pages/${name}.tsx`,
                `./pages/${name}/index.tsx`,
                `./pages/${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.tsx`,
            ];

            for (const path of possiblePaths) {
                if (pages[path]) {
                    return resolvePageComponent(path, pages).then((module) => module.default);
                }
            }

            throw new Error(`Page not found: ${name}`);
        },
        setup: ({ App, props }) => {
            const ziggy = page.props.ziggy as SharedData['ziggy'];
            Object.defineProperty(globalThis, 'route', {
                configurable: true,
                value: (...[name, params, absolute]: Parameters<typeof route>) =>
                    route(name, params, absolute, { ...ziggy, location: new URL(ziggy.location) }),
            });

            return <App {...props} />;
        },
    }),
);
