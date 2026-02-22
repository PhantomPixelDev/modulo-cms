import * as React from 'react';
import { cn } from '@/lib/utils';
import { Users, Shield, FileText, ImageIcon, File, Palette, Layers, Tags, type LucideIcon } from 'lucide-react';

export interface DashboardStatsProps {
  users?: number;
  roles?: number;
  posts?: number;
  media?: number;
  pages?: number;
  postTypes?: number;
  taxonomies?: number;
  themes?: number;
}

interface StatConfig {
  title: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
}

export function DashboardStats({ users = 0, roles = 0, posts = 0, media = 0, pages = 0, postTypes = 0, taxonomies = 0, themes = 0 }: DashboardStatsProps) {
  const stats: StatConfig[] = [
    {
      title: 'Total Users',
      value: users,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Roles',
      value: roles,
      icon: Shield,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Posts',
      value: posts,
      icon: FileText,
      gradient: 'from-emerald-500 to-teal-500',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Pages',
      value: pages,
      icon: File,
      gradient: 'from-violet-500 to-purple-500',
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Post Types',
      value: postTypes,
      icon: Layers,
      gradient: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    },
    {
      title: 'Taxonomies',
      value: taxonomies,
      icon: Tags,
      gradient: 'from-cyan-500 to-sky-500',
      iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'Themes',
      value: themes,
      icon: Palette,
      gradient: 'from-fuchsia-500 to-pink-500',
      iconBg: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
    },
    {
      title: 'Media Files',
      value: media,
      icon: ImageIcon,
      gradient: 'from-indigo-500 to-blue-500',
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-foreground/10"
          >
            {/* Subtle gradient accent */}
            <div className={cn(
              'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80',
              stat.gradient
            )} />
            
            <div className="flex items-center justify-between">
              <div className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
                stat.iconBg
              )}>
                <IconComponent className="h-5 w-5" />
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <p className="text-2xl font-bold tracking-tight">
                {stat.value.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
