import type { ComponentType } from 'react';

/** A component loaded on first use: `{ load: () => import('./Screen') }`. */
export type LazyComponent = { load: () => Promise<{ default: ComponentType<never> }> };

export type ComponentMap = Record<string, ComponentType<never> | LazyComponent>;

/** What the core publishes on window.Modulo before any plugin loads. */
export interface ModuloRuntime {
    /** Semver of the runtime contract. */
    version: string;
    /** The admin kit behind `import { Button } from '@modulo/ui'` (runtime 1.2.0+). */
    ui?: Record<string, unknown>;
    registerComponents(slug: string, components: ComponentMap): void;
    getComponent(slug: string, name: string): ComponentMap[string] | undefined;
    registered(): Record<string, string[]>;
}

declare global {
    interface Window {
        Modulo?: ModuloRuntime;
    }
}
