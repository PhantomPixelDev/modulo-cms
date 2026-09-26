import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    Database,
    FileText,
    HardDrive,
    ImageIcon,
    Palette,
    PenSquare,
    RefreshCcw,
    Server,
    Settings,
    Sparkles,
    Timer,
    UserPlus,
    Zap,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { DashboardOverview } from '../../components/dashboard/DashboardOverview';
import { DashboardStats } from '../../components/dashboard/DashboardStats';
import type { DashboardOverviewData } from '../../types';

const statusIcons: Record<string, LucideIcon> = {
    server: Server,
    uptime: Timer,
    database: Database,
    cache: Zap,
    storage: HardDrive,
    queue: Activity,
};

const STATUS_COLOR_TOKENS: Record<string, { text: string; indicator: string; badge: string; iconBg: string; border: string }> = {
    green: {
        text: 'text-foreground',
        indicator: 'bg-success',
        badge: 'bg-success/10 text-success',
        iconBg: 'bg-success/10 text-success',
        border: 'border-border',
    },
    blue: {
        text: 'text-foreground',
        indicator: 'bg-primary',
        badge: 'bg-primary/10 text-primary',
        iconBg: 'bg-primary/10 text-primary',
        border: 'border-border',
    },
    yellow: {
        text: 'text-foreground',
        indicator: 'bg-warning',
        badge: 'bg-warning/15 text-warning-foreground dark:text-warning',
        iconBg: 'bg-warning/15 text-warning-foreground dark:text-warning',
        border: 'border-warning/40',
    },
    red: {
        text: 'text-destructive',
        indicator: 'bg-destructive',
        badge: 'bg-destructive/10 text-destructive',
        iconBg: 'bg-destructive/10 text-destructive',
        border: 'border-destructive/40',
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

/** "just now", "5 minutes ago"… in the admin's language. */
const formatLastChecked = (iso?: string) => {
    const relative = new Intl.RelativeTimeFormat(document.documentElement.lang || undefined, { numeric: 'auto' });
    const date = iso ? new Date(iso) : new Date();
    const diffMinutes = Number.isNaN(date.getTime()) ? 0 : Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));

    if (diffMinutes < 60) return relative.format(-diffMinutes, 'minute');
    if (diffMinutes < 60 * 24) return relative.format(-Math.round(diffMinutes / 60), 'hour');
    return relative.format(-Math.round(diffMinutes / 1440), 'day');
};

const quickActions = [
    {
        labelKey: 'dashboard.home.quick_actions.new_post',
        icon: PenSquare,
        route: 'posts.create',
        color: 'text-blue-600 dark:text-blue-400',
    },
    {
        labelKey: 'dashboard.home.quick_actions.new_page',
        icon: FileText,
        route: 'pages.create',
        color: 'text-violet-600 dark:text-violet-400',
    },
    {
        labelKey: 'dashboard.home.quick_actions.add_user',
        icon: UserPlus,
        route: 'users.create',
        color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        labelKey: 'dashboard.home.quick_actions.media',
        icon: ImageIcon,
        route: 'media.index',
        color: 'text-amber-600 dark:text-amber-400',
    },
    {
        labelKey: 'dashboard.home.quick_actions.themes',
        icon: Palette,
        route: 'themes.index',
        color: 'text-pink-600 dark:text-pink-400',
    },
    {
        labelKey: 'dashboard.home.quick_actions.settings',
        icon: Settings,
        route: 'siteSettings.index',
        color: 'text-muted-foreground',
    },
];

type TranslateFn = (key: string, replacements?: Record<string, string | number>, fallback?: string) => string;

interface RenderDashboardHomeArgs {
    auth: any;
    adminStats: any;
    systemStatus: any;
    overview?: DashboardOverviewData;
    ROUTE: any;
    t: TranslateFn;
}

export function renderDashboardHome({ auth, adminStats, systemStatus, overview, ROUTE, t }: RenderDashboardHomeArgs): ReactNode {
    const userName = auth?.user?.name?.split(' ')[0] || 'Admin';
    const greetingKey = getGreetingKey();

    return (
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
            {/* Welcome Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <Sparkles className="size-4 text-primary" />
                        {t(`dashboard.home.greetings.${greetingKey}`)}
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('dashboard.home.welcome', { name: userName })}</h1>
                    <p className="max-w-xl text-sm text-muted-foreground sm:text-base">{t('dashboard.home.hero_description')}</p>
                </div>
                <Button onClick={() => router.visit(ROUTE.posts.create())} className="self-start sm:self-auto">
                    <PenSquare />
                    {t('dashboard.home.cta_create_post')}
                </Button>
            </div>

            {overview && <DashboardOverview overview={overview} />}

            {/* Quick Actions */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold">{t('dashboard.home.quick_actions_header')}</h2>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                    {quickActions.map((action) => {
                        const Icon = action.icon;
                        const routeFn = action.route.split('.').reduce((obj: any, key) => obj?.[key], ROUTE);
                        return (
                            <button
                                key={action.labelKey}
                                onClick={() => routeFn && router.visit(routeFn())}
                                className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 shadow-xs transition-colors outline-none hover:border-input hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                            >
                                <Icon className={cn('size-5 transition-transform group-hover:-translate-y-0.5', action.color)} />
                                <span className="text-xs font-medium text-foreground">{t(action.labelKey)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stats Grid */}
            {adminStats && (
                <div>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-base font-semibold">{t('dashboard.home.overview')}</h2>
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
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold">{t('dashboard.home.system_health')}</h2>
                    <span className="text-xs text-muted-foreground">{t('dashboard.home.auto_refresh')}</span>
                </div>

                {systemStatus ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(systemStatus).map(([key, status]: any) => {
                            const colors = getStatusColors(status.color);
                            const Icon = statusIcons[key] ?? RefreshCcw;
                            return (
                                <Card key={key} className={cn('gap-0 py-0 transition-colors hover:border-input', colors.border)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn('flex size-9 items-center justify-center rounded-lg', colors.iconBg)}>
                                                    <Icon className="size-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm text-muted-foreground">
                                                        {t(`dashboard.home.system.labels.${key}`, {}, status.label)}
                                                    </h3>
                                                    <p className={cn('text-base font-semibold tabular-nums', colors.text)}>
                                                        {['server', 'database', 'cache'].includes(key)
                                                            ? t(`dashboard.home.system.status.${status.status}`, {}, status.value)
                                                            : status.value}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div
                                                    className={cn(
                                                        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
                                                        colors.badge,
                                                    )}
                                                >
                                                    <span
                                                        className={cn(
                                                            'h-1.5 w-1.5 rounded-full',
                                                            colors.indicator,
                                                            status.indicator === 'pulse' ? 'animate-pulse' : '',
                                                        )}
                                                    />
                                                    {t(`dashboard.home.system.status.${status.status}`, {}, status.status)}
                                                </div>
                                                <span className="text-[11px] text-muted-foreground">{formatLastChecked(status.last_checked_at)}</span>
                                            </div>
                                        </div>

                                        {status.meta && Object.keys(status.meta).length > 0 && (
                                            <div className="mt-3 space-y-1 border-t pt-3">
                                                {Object.entries(status.meta).map(([metaKey, metaValue]: any) => (
                                                    <div key={`${key}-${metaKey}`} className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">{metaKey}</span>
                                                        <span className="font-medium tabular-nums">{metaValue ?? '—'}</span>
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
                                <p className="font-medium">{t('dashboard.home.system.loading')}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
