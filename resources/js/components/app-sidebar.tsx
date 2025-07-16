import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, Shield, Settings, FileText, Folder, Tag, Plus } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
];

// Admin navigation items
const adminNavItems: NavItem[] = [
    {
        title: 'Users',
        href: '/dashboard/admin/users',
        icon: Users,
    },
    {
        title: 'Roles',
        href: '/dashboard/admin/roles',
        icon: Shield,
    },
    {
        title: 'Posts',
        href: '/dashboard/admin/posts',
        icon: FileText,
    },
    {
        title: 'Post Types',
        href: '/dashboard/admin/post-types',
        icon: Plus,
    },
    {
        title: 'Taxonomies',
        href: '/dashboard/admin/taxonomies',
        icon: Folder,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
];

export function AppSidebar() {
    const page = usePage();
    const user = (page.props as any).auth?.user;
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
                <NavMain items={mainNavItems} />
                
                {/* Admin Navigation - Only show for admin users */}
                {user && (user.roles?.some((role: any) => ['admin', 'super-admin'].includes(role.name)) || user.permissions?.some((perm: any) => perm.name === 'view users')) && (
                    <>
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarMenu>
                                {adminNavItems.map((item) => (
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
