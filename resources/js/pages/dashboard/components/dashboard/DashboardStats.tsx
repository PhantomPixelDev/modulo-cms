import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, FileText, TrendingUp } from 'lucide-react';

export interface DashboardStatsProps {
  users?: number;
  roles?: number;
  posts?: number;
}

export function DashboardStats({ users = 0, roles = 0, posts = 0 }: DashboardStatsProps) {
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
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <IconComponent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
