import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import ErrorBoundary from './ErrorBoundary';
import { AdminToastProvider } from './components/admin/AdminToastProvider';
import { initializeTheme } from './hooks/use-appearance';
import { resolvePluginComponent } from './plugin-runtime';

declare global {
    interface Window {
        __FLASH_LISTENER_ADDED__?: boolean;
        __LAST_FLASH_SIG__?: string;
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Modulo CMS';

// Page components (standardized to a single `pages/` directory)
// Use lazy imports to avoid evaluating every page at startup
const pages = import.meta.glob(['./pages/**/*.tsx', '!./pages/**/*.test.tsx'], { eager: false });
const themeComponents = import.meta.glob(['../themes/**/components/**/*.tsx', '!../themes/**/*.test.tsx'], { eager: false });

createInertiaApp({
    // Admin screens pass a bare title ("Posts") and get the app name added. Public
    // pages come from the theme, which builds the whole title ("Page | Site").
    title: (title) => {
        const admin = typeof window !== 'undefined' && /^\/(dashboard|settings)(\/|$)/.test(window.location.pathname);
        return !title ? appName : admin ? `${title} - ${appName}` : title;
    },
    resolve: (name) => {
        // Plugins/<slug>/<Component>: loaded from the plugin's own bundle at
        // runtime. These cannot come from import.meta.glob, which Rollup
        // expands at build time -- a plugin installed afterwards has no chunk.
        if (name.startsWith('Plugins/')) {
            const [, slug, ...rest] = name.split('/');

            return resolvePluginComponent(slug, rest.join('/'));
        }

        // Check for theme components first (e.g., Themes/ModernReact/Index or Themes/ModernReact/Shop/Archive)
        if (name.startsWith('Themes/')) {
            // Convert Themes/ModernReact/Index to modern-react/Index
            // or Themes/ModernReact/Shop/Archive to modern-react/Shop/Archive
            const parts = name.split('/');
            const themeNamePascal = parts[1]; // ModernReact
            const componentPath = parts.slice(2).join('/'); // Index or Shop/Archive

            // Convert PascalCase to kebab-case for theme slug only
            const themeSlug = themeNamePascal.replace(/([A-Z])/g, (match, p1, offset) => {
                return offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase();
            });

            // Try exact path first
            const themeComponentPath = `../themes/${themeSlug}/components/${componentPath}.tsx`;

            if (themeComponents[themeComponentPath]) {
                return resolvePageComponent(themeComponentPath, themeComponents);
            }

            // Try index.tsx for directory-based components
            const indexPath = `../themes/${themeSlug}/components/${componentPath}/index.tsx`;
            if (themeComponents[indexPath]) {
                return resolvePageComponent(indexPath, themeComponents);
            }
        }

        // Try exact match within standardized `pages/` directory
        const possiblePaths = [
            `./pages/${name}.tsx`,
            `./pages/${name}/index.tsx`,
            // Handle kebab-case for routes like 'taxonomy-term'
            `./pages/${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}.tsx`,
        ];

        // Try to find the first matching path
        for (const path of possiblePaths) {
            if (pages[path]) {
                return resolvePageComponent(path, pages);
            }
        }

        // As a last resort, throw with available keys to aid debugging
        throw new Error(`Page not found: ./pages/${name}.tsx or ./pages/${name}/index.tsx or theme component ${name}`);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        // Attach global error hooks for visibility
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (e) => {
                console.error('[window.onerror]', e?.error || e?.message || e);
            });
            window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
                console.error('[window.unhandledrejection]', e?.reason);
            });
        }

        // Minimal initial render with global ErrorBoundary
        root.render(
            <ErrorBoundary>
                <AdminToastProvider>
                    <App {...props} />
                </AdminToastProvider>
            </ErrorBoundary>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// Initialize theme
initializeTheme();
