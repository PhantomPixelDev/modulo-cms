import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import GlobalToasts from './components/GlobalToasts';
import { toast } from 'sonner';

declare global {
    interface Window {
        __FLASH_LISTENER_ADDED__?: boolean;
        __LAST_FLASH_SIG__?: string;
    }
}

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Page components (standardized to a single `pages/` directory)
const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
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

        const showFlash = (flash: any) => {
            if (!flash) return;
            // Create a compact signature to avoid duplicate toasts across events/HMR
            const sig = JSON.stringify({
                s: flash.success ?? null,
                e: flash.error ?? null,
                w: flash.warning ?? null,
                i: flash.info ?? null,
                m: flash.message ?? null,
            });
            if (window.__LAST_FLASH_SIG__ === sig) return;

            if (flash.success) toast.success(flash.success);
            if (flash.error) toast.error(flash.error);
            if (flash.warning) toast.warning(flash.warning);
            if (flash.info) toast.info(flash.info);
            if (flash.message) toast(flash.message);

            window.__LAST_FLASH_SIG__ = sig;
        };

        // Initial render
        root.render(
            <>
                <App {...props} />
                <GlobalToasts />
            </>
        );

        // Trigger toasts for initial page
        try {
            // Inertia passes the initial page on props
            // @ts-ignore - initial page shape depends on adapter
            showFlash(props?.initialPage?.props?.flash);
        } catch {}

        // Show toasts on subsequent successful navigations (only attach once)
        if (!window.__FLASH_LISTENER_ADDED__) {
            router.on('success', (event: any) => {
                const page = event?.detail?.page;
                showFlash(page?.props?.flash);
            });
            window.__FLASH_LISTENER_ADDED__ = true;
        }
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
