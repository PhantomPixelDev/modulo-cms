import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Activity, Database, HardDrive, RefreshCcw, Server, Timer, Zap,
  PenSquare, FileText, UserPlus, Palette, ImageIcon, Settings, ArrowRight,
  Sparkles
} from 'lucide-react';
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
    text: 'text-emerald-600 dark:text-emerald-400',
    indicator: 'bg-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  blue: {
    text: 'text-sky-600 dark:text-sky-400',
    indicator: 'bg-sky-500',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20',
  },
  yellow: {
    text: 'text-amber-600 dark:text-amber-400',
    indicator: 'bg-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
  },
  red: {
    text: 'text-rose-600 dark:text-rose-400',
    indicator: 'bg-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
  },
  gray: {
    text: 'text-muted-foreground',
    indicator: 'bg-muted-foreground/60',
    badge: 'bg-muted text-muted-foreground',
    iconBg: 'bg-muted text-muted-foreground',
    border: 'border-border',
  },
};

const getStatusColors = (tone: string) => STATUS_COLOR_TOKENS[tone] ?? STATUS_COLOR_TOKENS.gray;

const getGreetingKey = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const formatLastChecked = (iso?: string) => {
  if (!iso) return 'Just now';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMinutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes <= 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const quickActions = [
  { 
    labelKey: 'dashboard.home.quick_actions.new_post', 
    icon: PenSquare, 
    route: 'posts.create',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20',
  },
  { 
    labelKey: 'dashboard.home.quick_actions.new_page', 
    icon: FileText, 
    route: 'pages.create',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
  },
  { 
    labelKey: 'dashboard.home.quick_actions.add_user', 
    icon: UserPlus, 
    route: 'users.create',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
  },
  { 
    labelKey: 'dashboard.home.quick_actions.media', 
    icon: ImageIcon, 
    route: 'media.index',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20',
  },
  { 
    labelKey: 'dashboard.home.quick_actions.themes', 
    icon: Palette, 
    route: 'themes.index',
    color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20',
  },
  { 
    labelKey: 'dashboard.home.quick_actions.settings', 
    icon: Settings, 
    route: 'settings.index',
    color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 hover:bg-slate-500/20',
  },
];

type TranslateFn = (key: string, replacements?: Record<string, string | number>) => string;

interface RenderDashboardHomeArgs {
  auth: any;
  adminStats: any;
  systemStatus: any;
  ROUTE: any;
  t: TranslateFn;
}

export function renderDashboardHome({
  auth,
  adminStats,
  systemStatus,
  ROUTE,
  t,
}: RenderDashboardHomeArgs): ReactNode {
  const userName = auth?.user?.name?.split(' ')[0] || 'Admin';
  const greetingKey = getGreetingKey();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">{t(`dashboard.home.greetings.${greetingKey}`)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('dashboard.home.welcome', { name: userName })}
            </h1>
            <p className="text-muted-foreground max-w-lg">
              {t('dashboard.home.hero_description')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.visit(ROUTE.posts.create())} className="gap-2">
              <PenSquare className="h-4 w-4" />
              {t('dashboard.home.cta_create_post')}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('dashboard.home.quick_actions_header')}</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const routeFn = action.route.split('.').reduce((obj: any, key) => obj?.[key], ROUTE);
            return (
              <button
                key={action.labelKey}
                onClick={() => routeFn && router.visit(routeFn())}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all',
                  'border border-transparent hover:border-border',
                  action.color
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{t(action.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats Grid */}
      {adminStats && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('dashboard.home.overview')}</h2>
          </div>
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
        </div>
      )}

      {/* System Status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('dashboard.home.system_health')}</h2>
          <span className="text-xs text-muted-foreground">{t('dashboard.home.auto_refresh')}</span>
        </div>
        
        {systemStatus ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(systemStatus).map(([key, status]: any) => {
              const colors = getStatusColors(status.color);
              const Icon = statusIcons[key] ?? RefreshCcw;
              return (
                <Card
                  key={key}
                  className={cn(
                    'relative overflow-hidden transition-all hover:shadow-md',
                    colors.border
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          colors.iconBg
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">{status.label}</h3>
                          <p className={cn('text-lg font-bold', colors.text)}>{status.value}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                          colors.badge
                        )}>
                          <span className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            colors.indicator,
                            status.indicator === 'pulse' ? 'animate-pulse' : ''
                          )} />
                          {status.status}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatLastChecked(status.last_checked_at)}
                        </span>
                      </div>
                    </div>
                    
                    {status.meta && Object.keys(status.meta).length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-1">
                        {Object.entries(status.meta).map(([metaKey, metaValue]: any) => (
                          <div key={`${key}-${metaKey}`} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{metaKey}</span>
                            <span className="font-medium">{metaValue ?? '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Loading system metrics...</p>
                <p className="text-sm text-muted-foreground">Gathering the latest health data</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
