import { type NavItem } from '@/types';
import { BookOpen, Github, LayoutDashboard } from 'lucide-react';

export const mainNav: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
];

export const externalNavRight: NavItem[] = [
    { title: 'Repository', href: 'https://github.com/PhantomPixelDev/modulo-cms', icon: Github },
    { title: 'Documentation', href: 'https://github.com/PhantomPixelDev/modulo-cms/tree/main/docs', icon: BookOpen },
];
