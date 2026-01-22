import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, FileText, TrendingUp, File, Palette, Layers, Tags } from 'lucide-react';

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

export function DashboardStats({ users = 0, roles = 0, posts = 0, media = 0, pages = 0, postTypes = 0, taxonomies = 0, themes = 0 }: DashboardStatsProps) {
  const stats = [
    {
      title: 'Users',
      value: users,
      icon: Users,
      description: 'Total registered users'
    },
    {
      title: 'Roles',
      value: roles,
      icon: Shield,
      description: 'User permission roles'
    },
    {
      title: 'Posts',
      value: posts,
      icon: FileText,
      description: 'Published content'
    },
    {
      title: 'Post Types',
      value: postTypes,
      icon: Layers,
      description: 'Content type definitions'
    },
    {
      title: 'Pages',
      value: pages,
      icon: File,
      description: 'Static pages'
    },
    {
      title: 'Taxonomies',
      value: taxonomies,
      icon: Tags,
      description: 'Classification structures'
    },
    {
      title: 'Themes',
      value: themes,
      icon: Palette,
      description: 'Available themes'
    },
    {
      title: 'Media',
      value: media,
      icon: TrendingUp,
      description: 'Total media files'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={stat.title}
            className="shadow-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 pt-3">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className="h-3.5 w-3.5 text-primary/70" />
            </CardHeader>
            <CardContent className="pt-0 pb-3">
              <div className="text-lg font-bold text-foreground leading-none">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
