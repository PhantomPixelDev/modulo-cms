 import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import { adminNav, mainNav } from '@/config/nav';
import { useAcl } from '@/lib/acl';

export function AppSidebar() {
    const page = usePage();
    const { isAdmin, hasPermission, canAny } = useAcl();
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
                
                {/* Admin Navigation - Only show for admins or users with any admin feature permissions */}
                {(isAdmin() || hasPermission('view users') || canAny(['view roles','view posts','view pages','view templates','view themes','view menus','view taxonomies','view taxonomy terms','view post types'])) && (
                    <>
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarMenu>
                                {adminNav.map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
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
