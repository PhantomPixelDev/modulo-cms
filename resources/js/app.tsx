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

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
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
