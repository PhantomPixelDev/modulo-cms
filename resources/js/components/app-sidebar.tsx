import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useTranslation } from '@/hooks/useTranslation';
import { useAcl } from '@/lib/acl';
import { getIcon } from '@/lib/icons';
import { Link, usePage } from '@inertiajs/react';
import {
    Archive,
    BookOpen,
    Boxes,
    CornerDownRight,
    FileText,
    FolderTree,
    History,
    ImageIcon,
    LayoutDashboard,
    Mail,
    Menu,
    MessageSquare,
    Palette,
    Puzzle,
    RefreshCw,
    Settings,
    ShieldCheck,
    Trash2,
    Users,
    type LucideIcon,
} from 'lucide-react';
import React from 'react';
import AppLogo from './app-logo';

interface SidebarEntry {
    id: number;
    name: string;
    label?: string | null;
    slug: string;
    menu_icon?: string | null;
    menu_position?: number | null;
}

/** An entry a plugin declares in its plugin.json (admin.menu), already filtered by permission on the server. */
interface PluginMenuEntry {
    plugin: string;
    label: string;
    icon: string | null;
    href: string;
    children: Array<{ label: string; href: string }>;
}

interface SidebarSharedProps {
    dynamicMenu?: { postTypes?: SidebarEntry[]; taxonomies?: SidebarEntry[] };
    pluginMenu?: PluginMenuEntry[];
    updatesPending?: { count: number; security: boolean } | null;
}

interface Item {
    label: string;
    href: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
    show: boolean;
    /** Paths that also count as this entry (defaults to href) */
    match?: string[];
    badge?: React.ReactNode;
}

const byMenuPosition = (a: SidebarEntry, b: SidebarEntry) => (a.menu_position || 999) - (b.menu_position || 999);

function Group({ label, items, url }: { label: string; items: Item[]; url: string }) {
    const visible = items.filter((item) => item.show);
    if (visible.length === 0) return null;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>{label}</SidebarGroupLabel>
            <SidebarMenu>
                {visible.map((item) => {
                    const Icon = item.icon;
                    return (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={(item.match ?? [item.href]).some(
                                    (path) => url === path || url.startsWith(`${path}/`) || url.startsWith(`${path}?`),
                                )}
                                tooltip={{ children: item.label }}
                            >
                                <Link href={item.href} prefetch>
                                    {Icon && <Icon className="h-4 w-4" />}
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                            {item.badge}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}

export function AppSidebar() {
    const { url, props } = usePage();
    const { dynamicMenu, pluginMenu = [], updatesPending } = props as unknown as SidebarSharedProps;
    const { isAdmin, canAny } = useAcl();
    const { t } = useTranslation();
    const can = (...permissions: string[]) => isAdmin() || canAny(permissions);
    const path = url.split('?')[0];

    // Pages and posts have their own entries; other types get one each
    const contentTypes = (dynamicMenu?.postTypes ?? []).filter((type) => !['page', 'post'].includes(type.name)).sort(byMenuPosition);
    const taxonomies = [...(dynamicMenu?.taxonomies ?? [])].sort(byMenuPosition);

    return (
        <Sidebar collapsible="icon" variant="inset" className="overflow-hidden">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="overflow-x-hidden overflow-y-auto">
                <SidebarGroup className="px-2 py-0">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={path === '/dashboard'} tooltip={{ children: t('dashboard.nav.dashboard') }}>
                                <Link href="/dashboard" prefetch>
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>{t('dashboard.nav.dashboard')}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                <Group
                    label={t('dashboard.nav.content')}
                    url={path}
                    items={[
                        {
                            label: t('dashboard.nav.posts'),
                            href: '/dashboard/admin/posts',
                            icon: FileText,
                            show: can('view posts'),
                            match: ['/dashboard/admin/posts'],
                        },
                        { label: t('dashboard.nav.pages'), href: '/dashboard/admin/pages', icon: FileText, show: can('view posts', 'view pages') },
                        { label: t('dashboard.nav.media'), href: '/dashboard/admin/media', icon: ImageIcon, show: can('view media') },
                        {
                            label: t('dashboard.nav.comments'),
                            href: '/dashboard/admin/comments',
                            icon: MessageSquare,
                            show: can('moderate comments'),
                        },
                        { label: t('dashboard.nav.trash'), href: '/dashboard/admin/trash', icon: Trash2, show: can('delete posts') },
                    ]}
                />

                <Group
                    label={t('dashboard.nav.content_types')}
                    url={path}
                    items={contentTypes.map((type) => ({
                        label: type.label || type.name,
                        href: `/dashboard/admin/posts/type/${type.slug}`,
                        icon: type.menu_icon ? (getIcon(type.menu_icon) as LucideIcon) : Boxes,
                        show: can('view posts'),
                    }))}
                />

                <Group
                    label={t('dashboard.nav.organization')}
                    url={path}
                    items={[
                        {
                            label: t('dashboard.nav.taxonomies'),
                            href: '/dashboard/admin/taxonomies',
                            icon: FolderTree,
                            show: can('view taxonomies', 'view taxonomy terms'),
                            match: ['/dashboard/admin/taxonomies', '/dashboard/admin/taxonomy-terms'],
                        },
                        ...taxonomies.map((taxonomy) => ({
                            label: taxonomy.label || taxonomy.name,
                            href: `/dashboard/admin/taxonomies/${taxonomy.slug}/terms`,
                            icon: taxonomy.menu_icon ? (getIcon(taxonomy.menu_icon) as LucideIcon) : FolderTree,
                            show: can('view taxonomy terms'),
                        })),
                    ]}
                />

                {pluginMenu.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>{t('dashboard.nav.extensions')}</SidebarGroupLabel>
                        <SidebarMenu>
                            {pluginMenu.map((entry) => {
                                const inside = [entry.href, ...entry.children.map((child) => child.href)].some(
                                    (href) => path === href.split('?')[0] || path.startsWith(`${href.split('?')[0]}/`),
                                );
                                return (
                                    <SidebarMenuItem key={`${entry.plugin}-${entry.href}`}>
                                        <SidebarMenuButton asChild isActive={inside} tooltip={{ children: entry.label }}>
                                            <Link href={entry.href} prefetch>
                                                {React.createElement(entry.icon ? getIcon(entry.icon) : Puzzle, { className: 'h-4 w-4' })}
                                                <span>{entry.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {inside && entry.children.length > 0 && (
                                            <SidebarMenuSub>
                                                {entry.children.map((child) => (
                                                    <SidebarMenuSubItem key={child.href}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={path === child.href.split('?')[0] || path.startsWith(`${child.href}/`)}
                                                        >
                                                            <Link href={child.href} prefetch>
                                                                <span>{child.label}</span>
                                                            </Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                <Group
                    label={t('dashboard.nav.appearance')}
                    url={path}
                    items={[
                        { label: t('dashboard.nav.themes'), href: '/dashboard/admin/themes', icon: Palette, show: can('view themes') },
                        { label: t('dashboard.nav.menus'), href: '/dashboard/admin/menus', icon: Menu, show: can('view menus') },
                    ]}
                />

                <Group
                    label={t('dashboard.nav.administration')}
                    url={path}
                    items={[
                        { label: t('dashboard.nav.users'), href: '/dashboard/admin/users', icon: Users, show: can('view users') },
                        { label: t('dashboard.nav.roles'), href: '/dashboard/admin/roles', icon: ShieldCheck, show: can('view roles') },
                        { label: t('dashboard.nav.plugins'), href: '/dashboard/admin/plugins', icon: Puzzle, show: can('view plugins') },
                        { label: t('dashboard.nav.post_types'), href: '/dashboard/admin/post-types', icon: Boxes, show: can('view post types') },
                        { label: t('dashboard.nav.translations'), href: '/dashboard/admin/translations', icon: BookOpen, show: can('edit settings') },
                        { label: t('dashboard.nav.sitemap'), href: '/dashboard/admin/sitemap', icon: FolderTree, show: can('view sitemap') },
                        { label: t('dashboard.nav.site_settings'), href: '/dashboard/admin/settings', icon: Settings, show: can('view settings') },
                    ]}
                />

                <Group
                    label={t('dashboard.nav.system')}
                    url={path}
                    items={[
                        {
                            label: t('dashboard.nav.updates'),
                            href: '/dashboard/admin/system/updates',
                            icon: RefreshCw,
                            show: can('edit settings'),
                            badge:
                                updatesPending && updatesPending.count > 0 ? (
                                    <SidebarMenuBadge
                                        className={updatesPending.security ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'}
                                        aria-label={t('dashboard.nav.updates_available', { count: updatesPending.count })}
                                    >
                                        {updatesPending.count}
                                    </SidebarMenuBadge>
                                ) : undefined,
                        },
                        { label: t('dashboard.nav.email'), href: '/dashboard/admin/system/email', icon: Mail, show: can('edit settings') },
                        {
                            label: t('dashboard.nav.redirects'),
                            href: '/dashboard/admin/system/redirects',
                            icon: CornerDownRight,
                            show: can('edit settings'),
                        },
                        { label: t('dashboard.nav.activity'), href: '/dashboard/admin/system/activity', icon: History, show: isAdmin() },
                        { label: t('dashboard.nav.backups'), href: '/dashboard/admin/system/backups', icon: Archive, show: isAdmin() },
                    ]}
                />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
