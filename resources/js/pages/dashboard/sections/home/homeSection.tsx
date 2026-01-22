import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Activity, Database, HardDrive, RefreshCcw, Server, Timer, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DashboardStats } from '../../components/dashboard/DashboardStats';

const statusIcons: Record<string, LucideIcon> = {
  server: Server,
  uptime: Timer,
  database: Database,
  cache: Zap,
  storage: HardDrive,
  queue: Activity,
};

const STATUS_COLOR_TOKENS: Record<
  string,
  { text: string; indicator: string; badge: string; iconBg: string; border: string }
> = {
  green: {
    text: 'text-emerald-600',
    indicator: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
  },
  blue: {
    text: 'text-sky-600',
    indicator: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 border border-sky-200',
    iconBg: 'bg-sky-50 text-sky-600',
    border: 'border-sky-100',
  },
  yellow: {
    text: 'text-amber-600',
    indicator: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
  red: {
    text: 'text-rose-600',
    indicator: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700 border border-rose-200',
    iconBg: 'bg-rose-50 text-rose-600',
    border: 'border-rose-100',
  },
  gray: {
    text: 'text-muted-foreground',
    indicator: 'bg-muted-foreground/60',
    badge: 'bg-muted/80 text-muted-foreground border border-border/60',
    iconBg: 'bg-muted/70 text-muted-foreground',
    border: 'border-border/60',
  },
};

const getStatusColors = (tone: string) => STATUS_COLOR_TOKENS[tone] ?? STATUS_COLOR_TOKENS.gray;

const formatLastChecked = (iso?: string) => {
  if (!iso) return 'Updated moments ago';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Updated moments ago';

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes <= 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `Updated ${diffDays}d ago`;
};

export function renderDashboardHome({
  auth,
  adminStats,
  systemStatus,
  ROUTE,
}: {
  auth: any;
  adminStats: any;
  systemStatus: any;
  ROUTE: any;
}): ReactNode {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, {auth?.user?.name || 'Admin'}!</h1>
        <p className="text-muted-foreground text-sm">Here's what's happening with your CMS today.</p>
      </div>

      {/* Stats Grid */}
      {adminStats && (
        <DashboardStats
          users={adminStats.users}
          roles={adminStats.roles}
          posts={adminStats.posts}
          pages={adminStats.pages}
          postTypes={adminStats.postTypes}
          taxonomies={adminStats.taxonomies}
          themes={adminStats.themes}
          media={adminStats.media}
        />
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Quick Actions - Left Column */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start text-sm"
                variant="secondary"
                onClick={() => router.visit(ROUTE.posts.create())}
              >
                <span className="mr-2">📝</span> Create New Post
              </Button>
              <Button
                className="w-full justify-start text-sm"
                variant="secondary"
                onClick={() => router.visit(ROUTE.pages.create())}
              >
                <span className="mr-2">📄</span> Create New Page
              </Button>
              <Button
                className="w-full justify-start text-sm"
                variant="secondary"
                onClick={() => router.visit(ROUTE.users.create())}
              >
                <span className="mr-2">👤</span> Add New User
              </Button>
              <Button
                className="w-full justify-start text-sm"
                variant="secondary"
                onClick={() => router.visit(ROUTE.themes.index())}
              >
                <span className="mr-2">🎨</span> Manage Themes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Server Stats - Right 3 Columns */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStatus ? (
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(systemStatus).map(([key, status]: any) => {
                    const colors = getStatusColors(status.color);
                    const Icon = statusIcons[key] ?? RefreshCcw;
                    return (
                      <div
                        key={key}
                        className={cn(
                          'group relative overflow-hidden rounded-sm border bg-card/70 p-1.5 transition-colors',
                          'hover:border-foreground/10',
                          colors.border
                        )}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={cn(
                                'flex size-5 items-center justify-center rounded-full text-[10px] transition-colors',
                                colors.iconBg
                              )}
                            >
                              <Icon className="size-2.5" />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-[10px] font-semibold leading-none text-foreground">{status.label}</h3>
                            </div>
                          </div>
                          <div
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                              colors.badge
                            )}
                          >
                            <span
                              className={cn(
                                'h-2 w-2 rounded-full',
                                colors.indicator,
                                status.indicator === 'pulse' ? 'animate-pulse' : ''
                              )}
                            />
                            {status.status}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <div className={cn('text-sm font-semibold leading-tight', colors.text)}>{status.value}</div>
                          <div className="text-[8.5px] text-muted-foreground">{formatLastChecked(status.last_checked_at)}</div>
                        </div>
                        {status.meta && Object.keys(status.meta).length > 0 && (
                          <dl className="mt-1 grid gap-0.5 text-[8.5px] text-muted-foreground">
                            {Object.entries(status.meta).map(([metaKey, metaValue]: any) => (
                              <div key={`${key}-${metaKey}`} className="flex items-center justify-between gap-2">
                                <dt className="font-medium text-foreground/70">{metaKey}</dt>
                                <dd className="truncate text-right text-foreground/80">{metaValue ?? '—'}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted p-6 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <RefreshCcw className="size-5 animate-spin text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Fetching live metrics</p>
                    <p className="text-xs text-muted-foreground">Gathering the latest server health data…</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
