import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutDashboard, LogOut, Menu as MenuIcon, ShoppingCart, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { buttonClass, Container, isExternalUrl, normalizeMenuItems, useThemeT, type MenuItem } from './ui';

interface NavigationProps {
    className?: string;
    site?: any;
    menus?: any;
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
            roles?: Array<{ id: number; name: string }>;
            permissions?: Array<{ id: number; name: string }>;
        } | null;
    };
}

const pathOf = (url: string) => {
    try {
        return new URL(url, 'http://local').pathname.replace(/\/+$/, '') || '/';
    } catch {
        return url;
    }
};

function NavLink({ item, active, className, onNavigate }: { item: MenuItem; active: boolean; className?: string; onNavigate?: () => void }) {
    const url = item.url || '#';
    const label = item.label || item.title || url;
    const props = {
        className: cn(className, active && 'text-foreground'),
        'aria-current': active ? ('page' as const) : undefined,
        onClick: onNavigate,
    };
    if (isExternalUrl(url) || item.target === '_blank') {
        return (
            <a href={url} target={item.target ?? undefined} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined} {...props}>
                {label}
            </a>
        );
    }
    return (
        <Link href={url} {...props}>
            {label}
        </Link>
    );
}

const Navigation: React.FC<NavigationProps> = ({ className = '', site, menus, auth }) => {
    const { url: currentUrl, props } = usePage<{ activePlugins?: string[] }>();
    const tt = useThemeT();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    const shopActive = Array.isArray(props.activePlugins) && props.activePlugins.includes('modulo-shop');

    useEffect(() => {
        if (!shopActive) return;
        let isMounted = true;

        const fetchCartCount = async () => {
            try {
                const response = await fetch('/shop/cart/count');
                const data = await response.json();
                if (isMounted && typeof data.count === 'number') {
                    setCartCount(data.count);
                }
            } catch {
                // Silently ignore cart count errors
            }
        };

        fetchCartCount();
        const interval = window.setInterval(fetchCartCount, 30000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [shopActive]);

    // Close the mobile menu after navigating.
    useEffect(() => setIsMenuOpen(false), [currentUrl]);

    const menuItems = normalizeMenuItems(menus?.header);
    const fallbackItems: MenuItem[] = [
        { id: 'home', label: tt('nav.home', 'Home'), url: '/' },
        { id: 'posts', label: tt('nav.posts', 'Posts'), url: '/posts' },
        ...(shopActive ? [{ id: 'shop', label: tt('nav.shop', 'Shop'), url: '/shop' }] : []),
    ];
    // Hide links into the shop while the shop plugin is switched off.
    const items = (menuItems.length > 0 ? menuItems : fallbackItems).filter((item) => shopActive || !pathOf(item.url || '').startsWith('/shop'));

    const currentPath = pathOf(currentUrl || '/');
    const isActive = (item: MenuItem) => {
        const path = pathOf(item.url || '');
        return path === '/' ? currentPath === '/' : currentPath === path || currentPath.startsWith(`${path}/`);
    };

    const siteName = site?.name || 'Modulo CMS';
    const linkClass = 'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

    return (
        <header className={cn('sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70', className)}>
            <Container className="flex h-16 items-center justify-between gap-6">
                <Link href="/" className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-foreground">
                    {site?.logo ? (
                        <img src={site.logo} alt="" className="h-8 w-auto" />
                    ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                            {siteName.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <span className="truncate text-lg">{siteName}</span>
                </Link>

                {/* Desktop navigation */}
                <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
                    {items.map((item, index) => {
                        const children = normalizeMenuItems(item.children);
                        if (children.length === 0) {
                            return <NavLink key={item.id ?? index} item={item} active={isActive(item)} className={linkClass} />;
                        }
                        return (
                            <div key={item.id ?? index} className="group relative">
                                <button type="button" className={cn(linkClass, 'inline-flex items-center gap-1')} aria-haspopup="true">
                                    {item.label || item.title}
                                    <ChevronDown className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" />
                                </button>
                                <div className="invisible absolute top-full left-0 z-50 min-w-48 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                                    <div className="rounded-lg border bg-popover p-1 shadow-lg">
                                        {children.map((child, childIndex) => (
                                            <NavLink
                                                key={child.id ?? childIndex}
                                                item={child}
                                                active={isActive(child)}
                                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                <div className="hidden items-center gap-2 md:flex">
                    {shopActive && (
                        <Link href="/shop/cart" className={cn(buttonClass('ghost', 'sm'), 'relative')} aria-label={tt('nav.cart', 'Cart')}>
                            <ShoppingCart />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    )}
                    {auth?.user ? (
                        <>
                            <Link href="/dashboard" className={buttonClass('ghost', 'sm')}>
                                <LayoutDashboard />
                                {tt('nav.dashboard', 'Dashboard')}
                            </Link>
                            <Link href="/logout" method="post" as="button" className={buttonClass('outline', 'sm')}>
                                <LogOut />
                                {tt('nav.logout', 'Logout')}
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={buttonClass('ghost', 'sm')}>
                                {tt('nav.login', 'Login')}
                            </Link>
                            <Link href="/register" className={buttonClass('primary', 'sm')}>
                                {tt('nav.register', 'Register')}
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile menu button */}
                <button
                    type="button"
                    onClick={() => setIsMenuOpen((open) => !open)}
                    className={cn(buttonClass('ghost', 'sm'), 'md:hidden')}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-menu"
                    aria-label="Toggle navigation"
                >
                    {isMenuOpen ? <X /> : <MenuIcon />}
                </button>
            </Container>

            {/* Mobile navigation */}
            {isMenuOpen && (
                <div id="mobile-menu" className="border-t bg-background md:hidden">
                    <Container className="space-y-1 py-4">
                        {items.map((item, index) => (
                            <React.Fragment key={item.id ?? index}>
                                <NavLink
                                    item={item}
                                    active={isActive(item)}
                                    className="block rounded-md px-3 py-2.5 font-medium text-muted-foreground hover:bg-accent"
                                />
                                {normalizeMenuItems(item.children).map((child, childIndex) => (
                                    <NavLink
                                        key={child.id ?? childIndex}
                                        item={child}
                                        active={isActive(child)}
                                        className="block rounded-md py-2 pr-3 pl-7 text-sm text-muted-foreground hover:bg-accent"
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                        {shopActive && (
                            <Link
                                href="/shop/cart"
                                className="flex items-center justify-between rounded-md px-3 py-2.5 font-medium text-muted-foreground hover:bg-accent"
                            >
                                <span className="flex items-center gap-2">
                                    <ShoppingCart className="size-4" />
                                    {tt('nav.cart', 'Cart')}
                                </span>
                                {cartCount > 0 && <span className="text-sm tabular-nums">{cartCount}</span>}
                            </Link>
                        )}
                        <div className="mt-3 flex gap-2 border-t pt-4">
                            {auth?.user ? (
                                <>
                                    <Link href="/dashboard" className={buttonClass('outline', 'md', 'flex-1')}>
                                        {tt('nav.dashboard', 'Dashboard')}
                                    </Link>
                                    <Link href="/logout" method="post" as="button" className={buttonClass('ghost', 'md', 'flex-1')}>
                                        {tt('nav.logout', 'Logout')}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className={buttonClass('outline', 'md', 'flex-1')}>
                                        {tt('nav.login', 'Login')}
                                    </Link>
                                    <Link href="/register" className={buttonClass('primary', 'md', 'flex-1')}>
                                        {tt('nav.register', 'Register')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </Container>
                </div>
            )}
        </header>
    );
};

export default Navigation;
