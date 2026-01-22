 import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import { adminNav, mainNav } from '@/config/nav';
import { useAcl } from '@/lib/acl';
import * as LucideIcons from 'lucide-react';

export function AppSidebar() {
    const { url, props } = usePage();
    const { dynamicMenu } = props as any;
    const { activePlugins } = props as any;
    const { isAdmin, hasPermission, canAny } = useAcl();

    // Filter core adminNav to avoid duplicates if they are now dynamic
    const isModuloShopActive = Array.isArray(activePlugins) && activePlugins.includes('modulo-shop');

    const filteredAdminNav = adminNav.filter(item =>
        !['Posts', 'Pages', 'Post Types', 'Taxonomies'].includes(item.title)
    ).filter(item => {
        if (item.title !== 'Shop') return true;
        if (!isModuloShopActive) return false;
        return isAdmin() || canAny(['view shop products', 'create shop products', 'edit shop products', 'delete shop products']);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
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

            <SidebarContent>
                <NavMain items={mainNav} />

                {/* Content Section - keep a single entry (modular post types managed under Posts) */}
                {(isAdmin() || canAny(['view posts', 'view pages'])) && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Content</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={url.startsWith('/dashboard/admin/posts')} tooltip={{ children: 'Posts' }}>
                                    <Link href="/dashboard/admin/posts" prefetch>
                                        <LucideIcons.FileText className="h-4 w-4" />
                                        <span>Posts</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Organization Section - keep a single entry (taxonomies/terms managed under Taxonomies) */}
                {(isAdmin() || hasPermission('view taxonomies') || hasPermission('view taxonomy terms')) && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Organization</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={url.startsWith('/dashboard/admin/taxonomies') || url.startsWith('/dashboard/admin/taxonomy-terms')} tooltip={{ children: 'Taxonomies' }}>
                                    <Link href="/dashboard/admin/taxonomies" prefetch>
                                        <LucideIcons.Folder className="h-4 w-4" />
                                        <span>Taxonomies</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                )}
                
                {/* Admin Navigation - Only show for admins or users with any admin feature permissions */}
                {(isAdmin() || hasPermission('view users') || canAny(['view roles','view templates','view themes','view menus','view taxonomies','view taxonomy terms','view post types','view shop products','create shop products','edit shop products','delete shop products'])) && (
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
                                            <SidebarMenuButton asChild isActive={url.startsWith('/dashboard/admin/post-types')} tooltip={{ children: 'Post Types' }}>
                                                <Link href="/dashboard/admin/post-types" prefetch>
                                                    <LucideIcons.Plus className="h-4 w-4" />
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
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
