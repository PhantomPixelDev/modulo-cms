import { lazy, type ComponentType, type ReactNode } from 'react';

export interface ContentPartial {
    id: string;
    name: string;
    component: string;
    attributes: Record<string, string>;
    html: string;
}

export interface ThemePartialProps {
    name: string;
    attributes: Record<string, string>;
    children: ReactNode;
}

type PartialModule = { default: ComponentType<ThemePartialProps> };
const modules = import.meta.glob<PartialModule>([
    '../themes/*/components/partials/**/*.tsx',
    '../themes/*/partials/**/*.tsx',
    '!../themes/**/*.test.tsx',
]);
const components = new Map<string, ComponentType<ThemePartialProps>>();

/** Only build-time theme modules may be imported, never paths supplied in content. */
export function resolveThemePartial(component: string): ComponentType<ThemePartialProps> | null {
    if (!/^[a-z0-9-]+\/(?:components\/partials|partials)\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.tsx$/.test(component)) return null;
    const load = modules[`../themes/${component}`];
    if (!load) return null;
    if (!components.has(component)) components.set(component, lazy(load));
    return components.get(component) ?? null;
}
