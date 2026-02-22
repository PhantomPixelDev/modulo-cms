import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const pages = import.meta.glob('./pages/**/*.tsx', { eager: false });
const themeComponents = import.meta.glob('../themes/**/components/**/*.tsx', { eager: false });

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => title ? `${title} - ${appName}` : appName,
        resolve: (name) => {
            if (name.startsWith('Themes/')) {
                const parts = name.split('/');
                const themeNamePascal = parts[1];
                const componentPath = parts.slice(2).join('/');

                const themeSlug = themeNamePascal.replace(/([A-Z])/g, (match, p1, offset) => {
                    return offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase();
                });

                const themeComponentPath = `../themes/${themeSlug}/components/${componentPath}.tsx`;
                if (themeComponents[themeComponentPath]) {
                    return resolvePageComponent(themeComponentPath, themeComponents);
                }

                const indexPath = `../themes/${themeSlug}/components/${componentPath}/index.tsx`;
                if (themeComponents[indexPath]) {
                    return resolvePageComponent(indexPath, themeComponents);
                }
            }

            const possiblePaths = [
                `./pages/${name}.tsx`,
                `./pages/${name}/index.tsx`,
                `./pages/${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.tsx`,
            ];

            for (const path of possiblePaths) {
                if (pages[path]) {
                    return resolvePageComponent(path, pages);
                }
            }

            throw new Error(`Page not found: ${name}`);
        },
        setup: ({ App, props }) => {
            /* eslint-disable */
            // @ts-expect-error
            global.route<RouteName> = (name, params, absolute) =>
                route(name, params as any, absolute, {
                    // @ts-expect-error
                    ...page.props.ziggy,
                    // @ts-expect-error
                    location: new URL(page.props.ziggy.location),
                });
            /* eslint-enable */

            return <App {...props} />;
        },
    }),
);
