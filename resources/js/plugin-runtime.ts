import * as Inertia from '@inertiajs/react';
import type { ComponentType } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as JsxRuntime from 'react/jsx-runtime';

/**
 * The contract between the core bundle and a plugin's own bundle.
 *
 * Inertia resolves page components through `import.meta.glob`, which Rollup
 * expands at build time. A plugin installed after the core was built therefore
 * has no chunk and can never contribute a page that way. The only route that
 * does not require rebuilding the core on the server -- which production
 * cannot do, since the image ships no Node -- is for a plugin to bring its own
 * bundle and register what it provides at runtime.
 *
 * React must not be duplicated: two copies means two independent hook
 * dispatchers, and a plugin's components would crash the moment they used a
 * hook. So the core publishes its own instances here and plugins build with
 * these marked external.
 */

type LazyComponent = { load: () => Promise<{ default: ComponentType<unknown> }> };

type ComponentMap = Record<string, ComponentType<unknown> | LazyComponent>;

interface ModuloRuntime {
    /** Semver of the runtime contract, for a plugin to check against. */
    version: string;
    /** Shared singletons. A plugin bundling its own React will break on hooks. */
    vendor: {
        react: typeof React;
        reactDOM: typeof ReactDOM;
        jsxRuntime: typeof JsxRuntime;
        inertia: typeof Inertia;
    };
    registerComponents(slug: string, components: ComponentMap): void;
    getComponent(slug: string, name: string): ComponentMap[string] | undefined;
    registered(): Record<string, string[]>;
}

const registry = new Map<string, ComponentMap>();

const runtime: ModuloRuntime = {
    version: '1.1.0',

    vendor: {
        react: React,
        reactDOM: ReactDOM,
        jsxRuntime: JsxRuntime,
        inertia: Inertia,
    },

    registerComponents(slug, components) {
        const existing = registry.get(slug) ?? {};
        registry.set(slug, { ...existing, ...components });
    },

    getComponent(slug, name) {
        return registry.get(slug)?.[name];
    },

    registered() {
        return Object.fromEntries([...registry.entries()].map(([slug, map]) => [slug, Object.keys(map)]));
    },
};

declare global {
    interface Window {
        Modulo?: ModuloRuntime;
    }
}

if (typeof window !== 'undefined') {
    window.Modulo = runtime;
}

function isLazy(value: ComponentType<unknown> | LazyComponent): value is LazyComponent {
    return typeof value === 'object' && value !== null && typeof (value as LazyComponent).load === 'function';
}

/** Tracks in-flight loads so a bundle is fetched once, not once per page visit. */
const loading = new Map<string, Promise<void>>();

/**
 * Load a plugin's bundle and return one of the components it registered.
 *
 * The URL is built from the slug rather than taken from the server, and the
 * slug is constrained, so a page prop cannot point this at an arbitrary
 * script.
 */
export async function resolvePluginComponent(slug: string, name: string): Promise<{ default: ComponentType<unknown> }> {
    if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new Error(`Refusing to load a plugin bundle for an invalid slug: "${slug}"`);
    }

    if (!registry.has(slug)) {
        if (!loading.has(slug)) {
            const url = `/plugins/${slug}/plugin.js`;
            loading.set(
                slug,
                import(/* @vite-ignore */ url).catch((error) => {
                    loading.delete(slug);
                    throw new Error(`Could not load the bundle for plugin "${slug}" from ${url}: ${error}`);
                }),
            );
        }

        await loading.get(slug);
    }

    const component = runtime.getComponent(slug, name);

    if (!component) {
        const available = Object.keys(registry.get(slug) ?? {}).join(', ') || 'none';
        throw new Error(`Plugin "${slug}" does not provide a component named "${name}". It registered: ${available}.`);
    }

    // Lazy entries are declared as { load }, never as a bare function: a
    // function component and a thunk returning one are both typeof 'function'
    // and cannot be distinguished, and guessing wrong calls the component
    // outside a render, which fails with "invalid hook call".
    if (isLazy(component)) {
        return await component.load();
    }

    return { default: component };
}

export type { ComponentMap, LazyComponent, ModuloRuntime };
