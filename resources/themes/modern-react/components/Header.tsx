import { usePage } from '@inertiajs/react';
import Navigation from './partials/Navigation';
import type { MenuItem } from './partials/ui';

interface HeaderProps {
    site?: {
        name?: string;
        tagline?: string;
        logo?: string;
    };
    menu?: MenuItem[];
    /** Kept for backwards compatibility; colours now come from the site tokens. */
    theme?: unknown;
}

/**
 * Standalone header template (theme.json "header"). The Layout renders the
 * same Navigation partial, so both stay visually identical.
 */
export default function Header({ site, menu }: HeaderProps) {
    const { auth } = usePage().props as { auth?: { user?: any } };
    return <Navigation site={site} menus={{ header: menu ?? [] }} auth={auth} />;
}
