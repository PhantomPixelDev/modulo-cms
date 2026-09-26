import type { ComponentType } from 'react';

declare global {
    /** Ziggy's route helper, provided by the core's admin pages. */
    function route(name: string, params?: Record<string, unknown>, absolute?: boolean): string;

    interface Window {
        Modulo?: {
            version: string;
            registerComponents(slug: string, components: Record<string, ComponentType<never> | { load: () => Promise<unknown> }>): void;
        };
    }
}

export {};
