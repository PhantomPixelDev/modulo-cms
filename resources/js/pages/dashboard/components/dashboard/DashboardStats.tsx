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
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={stat.title}
            className="border-border/60 bg-card/70 shadow-none rounded-sm"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5">
              <CardTitle className="text-[9.5px] font-medium uppercase tracking-wide text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className="h-3 w-3 text-muted-foreground/70" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-semibold text-foreground">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-[8.5px] text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
