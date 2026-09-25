import { NavMain } from '@/components/nav-main';
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
} from '@/components/ui/sidebar';
import { adminNav, mainNav } from '@/config/nav';
import { useAcl } from '@/lib/acl';
import { getIcon } from '@/lib/icons';
import { Link, usePage } from '@inertiajs/react';
import { Archive, Boxes, FileText, FolderTree, History, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';
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

interface SidebarSharedProps {
    dynamicMenu?: { postTypes?: SidebarEntry[]; taxonomies?: SidebarEntry[] };
    activePlugins?: string[];
    updatesPending?: { count: number; security: boolean } | null;
}

const byMenuPosition = (a: SidebarEntry, b: SidebarEntry) => (a.menu_position || 999) - (b.menu_position || 999);

export function AppSidebar() {
    const { url, props } = usePage();
    const { dynamicMenu, activePlugins, updatesPending } = props as unknown as SidebarSharedProps;
    const { isAdmin, hasPermission, canAny } = useAcl();

    // Filter core adminNav to avoid duplicates if they are now dynamic
    const isModuloShopActive = Array.isArray(activePlugins) && activePlugins.includes('modulo-shop');
    const isContactFormActive = Array.isArray(activePlugins) && activePlugins.includes('contact-form');

    const filteredAdminNav = adminNav
        .filter((item) => !['Posts', 'Pages', 'Post Types', 'Taxonomies'].includes(item.title))
        .filter((item) => {
            if (item.title === 'Shop') {
                return (
                    isModuloShopActive &&
                    (isAdmin() || canAny(['view shop products', 'create shop products', 'edit shop products', 'delete shop products']))
                );
            }
            if (item.title === 'Contact Form') {
                return isContactFormActive && (isAdmin() || hasPermission('manage contact form'));
            }
            return true;
        });

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
                <NavMain items={mainNav} />

                {/* Content Section - keep a single entry (modular post types managed under Posts) */}
                {(isAdmin() || canAny(['view posts', 'view pages'])) && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Content</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={url.startsWith('/dashboard/admin/posts')} tooltip={{ children: 'Posts' }}>
                                    <Link href="/dashboard/admin/posts" prefetch>
                                        <FileText className="h-4 w-4" />
                                        <span>Posts</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            {(isAdmin() || hasPermission('moderate comments')) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={url.startsWith('/dashboard/admin/comments')}
                                        tooltip={{ children: 'Comments' }}
                                    >
                                        <Link href="/dashboard/admin/comments" prefetch>
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Comments</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {(isAdmin() || hasPermission('delete posts')) && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={url.startsWith('/dashboard/admin/trash')} tooltip={{ children: 'Trash' }}>
                                        <Link href="/dashboard/admin/trash" prefetch>
                                            <Trash2 className="h-4 w-4" />
                                            <span>Trash</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Organization Section - keep a single entry (taxonomies/terms managed under Taxonomies) */}
                {(isAdmin() || hasPermission('view taxonomies') || hasPermission('view taxonomy terms')) && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Organization</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url.startsWith('/dashboard/admin/taxonomies') || url.startsWith('/dashboard/admin/taxonomy-terms')}
                                    tooltip={{ children: 'Taxonomies' }}
                                >
                                    <Link href="/dashboard/admin/taxonomies" prefetch>
                                        <FolderTree className="h-4 w-4" />
                                        <span>Taxonomies</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Dynamic Post Types */}
                {dynamicMenu?.postTypes && dynamicMenu.postTypes.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Content Types</SidebarGroupLabel>
                        <SidebarMenu>
                            {[...dynamicMenu.postTypes].sort(byMenuPosition).map((postType) => (
                                <SidebarMenuItem key={postType.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={url.startsWith(`/dashboard/admin/posts/type/${postType.slug}`)}
                                        tooltip={{ children: postType.label || postType.name }}
                                    >
                                        <Link href={`/dashboard/admin/posts/type/${postType.slug}`} prefetch>
                                            {postType.menu_icon && React.createElement(getIcon(postType.menu_icon), { className: 'h-4 w-4' })}
                                            <span>{postType.label || postType.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Dynamic Taxonomies */}
                {dynamicMenu?.taxonomies && dynamicMenu.taxonomies.length > 0 && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Categories</SidebarGroupLabel>
                        <SidebarMenu>
                            {[...dynamicMenu.taxonomies].sort(byMenuPosition).map((taxonomy) => (
                                <SidebarMenuItem key={taxonomy.id}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={url.startsWith(`/dashboard/admin/taxonomies/${taxonomy.slug}/terms`)}
                                        tooltip={{ children: taxonomy.label || taxonomy.name }}
                                    >
                                        <Link href={`/dashboard/admin/taxonomies/${taxonomy.slug}/terms`} prefetch>
                                            {taxonomy.menu_icon && React.createElement(getIcon(taxonomy.menu_icon), { className: 'h-4 w-4' })}
                                            <span>{taxonomy.label || taxonomy.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Admin Navigation - Only show for admins or users with any admin feature permissions */}
                {(isAdmin() ||
                    hasPermission('view users') ||
                    canAny([
                        'view roles',
                        'view templates',
                        'view themes',
                        'view menus',
                        'view taxonomies',
                        'view taxonomy terms',
                        'view post types',
                        'view shop products',
                        'create shop products',
                        'edit shop products',
                        'delete shop products',
                    ])) && (
                    <>
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarMenu>
                                {filteredAdminNav.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                                {/* Add back Post Types and Taxonomies managers at the bottom of Admin */}
                                {canAny(['view post types', 'view taxonomies']) && (
                                    <>
                                        <SidebarMenuItem>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={url.startsWith('/dashboard/admin/post-types')}
                                                tooltip={{ children: 'Post Types' }}
                                            >
                                                <Link href="/dashboard/admin/post-types" prefetch>
                                                    <Boxes className="h-4 w-4" />
                                                    <span>Post Types</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    </>
                                )}
                            </SidebarMenu>
                        </SidebarGroup>
                    </>
                )}

                {/* System: updates and backups (administrators only) */}
                {(isAdmin() || hasPermission('edit settings')) && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>System</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={url.startsWith('/dashboard/admin/system/updates')}
                                    tooltip={{ children: 'Updates' }}
                                >
                                    <Link href="/dashboard/admin/system/updates" prefetch>
                                        <RefreshCw />
                                        <span>Updates</span>
                                    </Link>
                                </SidebarMenuButton>
                                {updatesPending && updatesPending.count > 0 && (
                                    <SidebarMenuBadge
                                        className={updatesPending.security ? 'bg-destructive text-white' : 'bg-primary text-primary-foreground'}
                                        aria-label={`${updatesPending.count} updates available`}
                                    >
                                        {updatesPending.count}
                                    </SidebarMenuBadge>
                                )}
                            </SidebarMenuItem>
                            {isAdmin() && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={url.startsWith('/dashboard/admin/system/activity')}
                                        tooltip={{ children: 'Activity' }}
                                    >
                                        <Link href="/dashboard/admin/system/activity" prefetch>
                                            <History />
                                            <span>Activity</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                            {isAdmin() && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={url.startsWith('/dashboard/admin/system/backups')}
                                        tooltip={{ children: 'Backups' }}
                                    >
                                        <Link href="/dashboard/admin/system/backups" prefetch>
                                            <Archive />
                                            <span>Backups</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
