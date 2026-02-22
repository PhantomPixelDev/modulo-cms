import { type NavItem } from '@/types';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  FileText, 
  FolderTree, 
  Boxes, 
  Palette, 
  Menu, 
  Settings, 
  BookOpen, 
  MapPin, 
  ImageIcon, 
  Mail, 
  ShoppingBag,
  Puzzle,
  Github
} from 'lucide-react';

export const mainNav: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
];

export const adminNav: NavItem[] = [
  { title: 'Posts', href: '/dashboard/admin/posts', icon: FileText },
  { title: 'Pages', href: '/dashboard/admin/pages', icon: FileText },
  { title: 'Post Types', href: '/dashboard/admin/post-types', icon: Boxes },
  { title: 'Taxonomies', href: '/dashboard/admin/taxonomies', icon: FolderTree },
  { title: 'Menus', href: '/dashboard/admin/menus', icon: Menu },
  { title: 'Media', href: '/dashboard/admin/media', icon: ImageIcon },
  { title: 'Shop', href: '/dashboard/admin/shop/products', icon: ShoppingBag },
  { title: 'Contact Form', href: '/dashboard/admin/plugins/contact-form/settings', icon: Mail },
  { title: 'Users', href: '/dashboard/admin/users', icon: Users },
  { title: 'Roles', href: '/dashboard/admin/roles', icon: ShieldCheck },
  { title: 'Themes', href: '/dashboard/admin/themes', icon: Palette },
  { title: 'Plugins', href: '/dashboard/admin/plugins', icon: Puzzle },
  { title: 'Sitemap', href: '/dashboard/admin/sitemap', icon: MapPin },
  { title: 'Translations', href: '/dashboard/admin/translations', icon: BookOpen },
  { title: 'Site Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export const externalNavRight: NavItem[] = [
  { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Github },
  { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
];
