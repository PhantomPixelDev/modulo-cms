import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface DashboardStatsProps {
  users?: number;
  roles?: number;
  posts?: number;
}

export function DashboardStats({ users = 0, roles = 0, posts = 0 }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-semibold">{users}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Roles</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-semibold">{roles}</div></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Posts</CardTitle></CardHeader>
        <CardContent><div className="text-3xl font-semibold">{posts}</div></CardContent>
      </Card>
    </div>
  );
}
