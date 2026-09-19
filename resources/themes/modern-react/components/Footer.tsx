import { Link } from '@inertiajs/react';

interface FooterProps {
    site?: {
        name?: string;
        tagline?: string;
    };
    menu?: Array<Record<string, any>>;
    theme?: {
        colors?: {
            primary?: string;
            secondary?: string;
        };
    };
}

export default function Footer({ site, menu, theme }: FooterProps) {
    const currentYear = new Date().getFullYear();

    // Ensure menu is always an array
    const safeMenu = Array.isArray(menu) ? menu : [];

    // Ultra-safe menu normalization with limited shapes (arrays or items arrays)
    let items: Array<any> = [];
    try {
        if (!safeMenu) {
            items = [];
        } else if (Array.isArray(safeMenu)) {
            items = safeMenu.filter((item: any) => item && typeof item === 'object');
        } else if (typeof safeMenu === 'object' && safeMenu !== null) {
            const menuObj = safeMenu as any;
            if (Array.isArray(menuObj.items)) {
                items = menuObj.items.filter((item: any) => item && typeof item === 'object');
            } else {
                items = [];
            }
        }
    } catch (e) {
        console.warn('Footer menu normalization error:', e);
        items = [];
    }

    try {
        return (
            <footer className="border-t border-white/10 bg-indigo-950/95 backdrop-blur-sm">
                <div className="container mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Brand Column */}
                        <div className="md:col-span-2">
                            <div className="mb-6 flex items-center space-x-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-lg">
                                    {(site?.name || 'M').charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-2xl font-bold text-white">{site?.name || 'Modulo CMS'}</h3>
                            </div>
                            {site?.tagline && <p className="mb-6 max-w-md leading-relaxed text-blue-100/80">{site.tagline}</p>}
                            <p className="text-sm leading-relaxed text-blue-100/60">
                                Built with Modulo CMS - A modern, flexible content management system designed for the future.
                            </p>
                        </div>

                        {/* Navigation Column */}
                        <div>
                            <h4 className="mb-6 text-sm font-bold tracking-wider text-white uppercase">Navigation</h4>
                            <nav className="space-y-3">
                                {Array.isArray(items) &&
                                    items.length > 0 &&
                                    items.map((raw: any, idx: number) => {
                                        try {
                                            if (!raw || typeof raw !== 'object') return null;

                                            const safeItem = raw || {};
                                            const id = typeof safeItem.id === 'number' ? safeItem.id : idx;
                                            const label =
                                                typeof safeItem.label === 'string' && safeItem.label.length > 0
                                                    ? safeItem.label
                                                    : typeof safeItem.title === 'string' && safeItem.title.length > 0
                                                      ? safeItem.title
                                                      : 'Link';
                                            const url =
                                                typeof safeItem.url === 'string' && safeItem.url.length > 0
                                                    ? safeItem.url
                                                    : typeof safeItem.href === 'string' && safeItem.href.length > 0
                                                      ? safeItem.href
                                                      : '#';
                                            const target = typeof safeItem.target === 'string' ? safeItem.target : '_self';

                                            return (
                                                <Link
                                                    key={id}
                                                    href={url}
                                                    target={target}
                                                    className="block text-sm text-blue-100/80 transition-all duration-300 hover:translate-x-1 hover:text-white"
                                                >
                                                    {label}
                                                </Link>
                                            );
                                        } catch (itemErr) {
                                            console.warn('Footer menu item render error:', itemErr, raw);
                                            return null;
                                        }
                                    })}
                            </nav>
                        </div>

                        {/* Contact/Social Column */}
                        <div>
                            <h4 className="mb-6 text-sm font-bold tracking-wider text-white uppercase">Connect</h4>
                            <div className="space-y-3">
                                <a
                                    href="mailto:hello@example.com"
                                    className="block text-sm text-blue-100/80 transition-all duration-300 hover:translate-x-1 hover:text-white"
                                >
                                    Contact Us
                                </a>
                                <a
                                    href="/privacy"
                                    className="block text-sm text-blue-100/80 transition-all duration-300 hover:translate-x-1 hover:text-white"
                                >
                                    Privacy Policy
                                </a>
                                <a
                                    href="/terms"
                                    className="block text-sm text-blue-100/80 transition-all duration-300 hover:translate-x-1 hover:text-white"
                                >
                                    Terms of Service
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-8 border-t border-white/20 pt-8">
                        <div className="flex flex-col items-center justify-between md:flex-row">
                            <p className="text-sm text-blue-100/60">
                                &copy; {currentYear} {site?.name || 'Modulo CMS'}. All rights reserved.
                            </p>
                            <p className="mt-2 text-sm text-blue-100/60 md:mt-0">
                                Powered by{' '}
                                <a
                                    href="https://github.com/PhantomPixelDev/modulo-cms"
                                    className="font-medium text-blue-300 transition-colors duration-300 hover:text-white"
                                >
                                    Modulo CMS
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        );
    } catch (err) {
        // Fail-safe minimal footer with ultra-safe site name extraction
        console.error('Footer render error:', err, { site, menu, theme });
        const safeSiteName = site && typeof site.name === 'string' ? site.name : 'Modulo CMS';
        return (
            <footer className="border-t border-gray-200">
                <div className="container mx-auto px-6 py-6 text-center text-sm text-gray-500">
                    © {currentYear} {safeSiteName}
                </div>
            </footer>
        );
    }
}
