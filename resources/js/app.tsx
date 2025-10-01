import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
// TEMP: disable theme init and toasts to isolate crash
// import { initializeTheme } from './hooks/use-appearance';
// import GlobalToasts from './components/GlobalToasts';
// import { toast } from 'sonner';
import ErrorBoundary from './ErrorBoundary';

declare global {
    interface Window {
        __FLASH_LISTENER_ADDED__?: boolean;
        __LAST_FLASH_SIG__?: string;
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Page components (standardized to a single `pages/` directory)
// Use lazy imports to avoid evaluating every page at startup
const pages = import.meta.glob('./pages/**/*.tsx', { eager: false });
const themeComponents = import.meta.glob('../themes/**/components/**/*.tsx', { eager: false });

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => {
        // Check for theme components first (e.g., Themes/ModernReact/Index)
        if (name.startsWith('Themes/')) {
            // Convert Themes/ModernReact/Index to modern-react/Index
            const parts = name.split('/');
            const themeNamePascal = parts[1]; // ModernReact
            const componentName = parts[2]; // Index
            
            // Convert PascalCase to kebab-case
            const themeSlug = themeNamePascal.replace(/([A-Z])/g, (match, p1, offset) => {
                return offset > 0 ? '-' + p1.toLowerCase() : p1.toLowerCase();
            });
            
            const themeComponentPath = `../themes/${themeSlug}/components/${componentName}.tsx`;
            
            if (themeComponents[themeComponentPath]) {
                return resolvePageComponent(themeComponentPath, themeComponents);
            }
            
            // Fallback: try direct component name without .tsx
            const fallbackPath = `../themes/${themeSlug}/components/${componentName}`;
            if (themeComponents[fallbackPath]) {
                return resolvePageComponent(fallbackPath, themeComponents);
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
                <App {...props} />
            </ErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// TEMP: disable theme initialization during debugging
// initializeTheme();
