 import { type NavItem } from '@/types';
import { LayoutGrid, Users, Shield, FileText, Folder, Plus, Palette, List, Settings, BookOpen, Globe, Image } from 'lucide-react';

export const mainNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutGrid,
  },
];

export const adminNav: NavItem[] = [
  { title: 'Users', href: '/dashboard/admin/users', icon: Users },
  { title: 'Roles', href: '/dashboard/admin/roles', icon: Shield },
  { title: 'Posts', href: '/dashboard/admin/posts', icon: FileText },
  { title: 'Pages', href: '/dashboard/admin/pages', icon: FileText },
  { title: 'Post Types', href: '/dashboard/admin/post-types', icon: Plus },
  { title: 'Taxonomies', href: '/dashboard/admin/taxonomies', icon: Folder },
  { title: 'Menus', href: '/dashboard/admin/menus', icon: List },
  { title: 'Media', href: '/dashboard/admin/media', icon: Image },
  { title: 'Themes', href: '/dashboard/admin/themes', icon: Palette },
  { title: 'Sitemap', href: '/dashboard/admin/sitemap', icon: Globe },
  { title: 'Settings', href: '/settings', icon: Settings },
];

export const externalNavRight: NavItem[] = [
  { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Folder },
  { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
];
