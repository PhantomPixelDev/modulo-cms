import { ThemeBrand } from '@/components/theme-brand';
import type { ThemeSettingValues } from '@/theme-settings';
import { Link, usePage } from '@inertiajs/react';
import { Container, isExternalUrl, normalizeMenuItems, useThemeT, type MenuItem } from './partials/ui';

interface FooterProps {
    site?: {
        name?: string;
        tagline?: string;
        logo?: string | null;
    };
    menu?: MenuItem[] | { items?: MenuItem[] };
}

const linkClass = 'text-sm text-muted-foreground transition-colors hover:text-foreground';

function FooterLink({ item }: { item: MenuItem }) {
    const url = item.url || '#';
    const label = item.label || item.title || url;
    if (isExternalUrl(url) || item.target === '_blank') {
        return (
            <a href={url} target={item.target ?? undefined} rel="noopener noreferrer" className={linkClass}>
                {label}
            </a>
        );
    }
    return (
        <Link href={url} className={linkClass}>
            {label}
        </Link>
    );
}

export default function Footer({ site, menu }: FooterProps) {
    const { theme } = usePage<{ theme?: { settings?: ThemeSettingValues } }>().props;
    const values = theme?.settings ?? {};
    const tt = useThemeT();
    const currentYear = new Date().getFullYear();
    const siteName = site?.name || 'Modulo CMS';
    const items = normalizeMenuItems(menu);

    // Items with children become their own column; the rest share one.
    const groups = items.filter((item) => normalizeMenuItems(item.children).length > 0);
    const singles = items.filter((item) => normalizeMenuItems(item.children).length === 0);

    return (
        <footer className="border-t bg-muted/30">
            <Container className="py-14">
                <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]">
                    <div className="max-w-sm space-y-3">
                        {values.footer_show_brand !== false && (
                            <Link href="/" className="inline-flex max-w-full font-semibold tracking-tight text-foreground">
                                <ThemeBrand site={site} values={values} />
                            </Link>
                        )}
                        {values.footer_show_tagline !== false && site?.tagline && (
                            <p className="text-sm leading-relaxed text-muted-foreground">{site.tagline}</p>
                        )}
                    </div>

                    {singles.length > 0 && (
                        <nav aria-label={tt('footer.navigation', 'Navigation')}>
                            <h2 className="mb-3 text-sm font-semibold text-foreground">{tt('footer.navigation', 'Navigation')}</h2>
                            <ul className="space-y-2">
                                {singles.map((item, index) => (
                                    <li key={item.id ?? index}>
                                        <FooterLink item={item} />
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    )}

                    {groups.map((group, index) => (
                        <nav key={group.id ?? index} aria-label={group.label}>
                            <h2 className="mb-3 text-sm font-semibold text-foreground">{group.label || group.title}</h2>
                            <ul className="space-y-2">
                                {normalizeMenuItems(group.children).map((child, childIndex) => (
                                    <li key={child.id ?? childIndex}>
                                        <FooterLink item={child} />
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>
                        {typeof values.footer_text === 'string' && values.footer_text.trim() ? (
                            values.footer_text.replaceAll('{year}', String(currentYear)).replaceAll('{site}', siteName)
                        ) : (
                            <>
                                &copy; {currentYear} {siteName}. {tt('footer.rights', 'All rights reserved.')}
                            </>
                        )}
                    </p>
                    {values.footer_powered_by !== false && (
                        <p>
                            <a
                                href="https://github.com/PhantomPixelDev/modulo-cms"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-colors hover:text-foreground"
                            >
                                {tt('footer.powered_by', 'Powered by Modulo CMS')}
                            </a>
                        </p>
                    )}
                </div>
            </Container>
        </footer>
    );
}
