import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { CalendarClock, CheckCircle2, Circle, FilePen, History, MessageSquare, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { ROUTE } from '../../routes';
import type { DashboardOverviewData, OverviewPost } from '../../types';

/** Where each getting-started step is done. */
const STEP_LINKS: Record<string, () => string | null> = {
    site_name: () => ROUTE.siteSettings.index('general'),
    logo: () => ROUTE.siteSettings.index('general'),
    first_page: () => ROUTE.pages.create(),
    menu: () => route('dashboard.admin.menus.index'),
    email: () => route('dashboard.admin.system.email'),
    two_factor: () => route('two-factor.edit'),
};

const editHref = (item: OverviewPost) => (item.is_page ? ROUTE.pages.edit(item.id) : ROUTE.posts.edit(item.slug || item.id));

function Checklist({ steps }: { steps: Array<{ key: string; done: boolean }> }) {
    const { t } = useTranslation();
    const done = steps.filter((step) => step.done).length;
    const percent = Math.round((done / steps.length) * 100);

    return (
        <Card className="gap-4">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <CardTitle>{t('dashboard.home.checklist.title')}</CardTitle>
                    <CardDescription>{t('dashboard.home.checklist.description', { done, total: steps.length })}</CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t('dashboard.home.checklist.dismiss')}
                    title={t('dashboard.home.checklist.dismiss')}
                    onClick={() => router.post(route('dashboard.admin.onboarding.dismiss'), {}, { preserveScroll: true })}
                >
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('dashboard.home.checklist.title')}
                >
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                    {steps.map((step) => {
                        const href = STEP_LINKS[step.key]?.() ?? null;
                        const body = (
                            <>
                                {step.done ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                ) : (
                                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                )}
                                <span className="space-y-0.5">
                                    <span className={cn('block text-sm font-medium', step.done && 'text-muted-foreground line-through')}>
                                        {t(`dashboard.home.checklist.steps.${step.key}.title`)}
                                    </span>
                                    {!step.done && (
                                        <span className="block text-xs text-muted-foreground">
                                            {t(`dashboard.home.checklist.steps.${step.key}.hint`)}
                                        </span>
                                    )}
                                </span>
                            </>
                        );
                        return (
                            <li key={step.key}>
                                {href && !step.done ? (
                                    <Link href={href} className="flex gap-3 rounded-md border p-3 transition-colors hover:bg-accent/50">
                                        {body}
                                    </Link>
                                ) : (
                                    <div className="flex gap-3 rounded-md border p-3">{body}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}

function PostsCard({
    icon,
    title,
    empty,
    items,
    footer,
}: {
    icon: ReactNode;
    title: string;
    empty: string;
    items: OverviewPost[];
    footer?: ReactNode;
}) {
    return (
        <Card className="gap-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    {icon}
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{empty}</p>
                ) : (
                    <ul className="-mx-2 divide-y">
                        {items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    href={editHref(item)}
                                    className="flex items-baseline justify-between gap-3 rounded-md px-2 py-2 hover:bg-accent/50"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-medium">{item.title || '—'}</span>
                                        <span className="block truncate text-xs text-muted-foreground">
                                            {[item.type, item.author].filter(Boolean).join(' · ')}
                                        </span>
                                    </span>
                                    <time className="shrink-0 text-xs text-muted-foreground tabular-nums" dateTime={item.date_iso ?? undefined}>
                                        {item.date}
                                    </time>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                {footer && <div className="mt-auto pt-3">{footer}</div>}
            </CardContent>
        </Card>
    );
}

/**
 * The part of the dashboard home about the site's content: setup steps
 * still open, your drafts, what goes live next, and comments waiting.
 */
export function DashboardOverview({ overview }: { overview: DashboardOverviewData }) {
    const { t } = useTranslation();
    const comments = overview.pendingComments;

    return (
        <div className="space-y-6">
            {overview.checklist && overview.checklist.some((step) => !step.done) && <Checklist steps={overview.checklist} />}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {overview.drafts && (
                    <PostsCard
                        icon={<FilePen className="h-4 w-4 text-primary" />}
                        title={t('dashboard.home.widgets.drafts')}
                        empty={t('dashboard.home.widgets.drafts_empty')}
                        items={overview.drafts}
                        footer={
                            <Link href={`${ROUTE.posts.index()}?status=draft`} className="text-xs font-medium text-primary hover:underline">
                                {t('dashboard.home.widgets.all_drafts')}
                            </Link>
                        }
                    />
                )}
                {overview.scheduled && (
                    <PostsCard
                        icon={<CalendarClock className="h-4 w-4 text-primary" />}
                        title={t('dashboard.home.widgets.scheduled')}
                        empty={t('dashboard.home.widgets.scheduled_empty')}
                        items={overview.scheduled}
                    />
                )}
                {overview.recent && (
                    <PostsCard
                        icon={<History className="h-4 w-4 text-primary" />}
                        title={t('dashboard.home.widgets.recent')}
                        empty={t('dashboard.home.widgets.recent_empty')}
                        items={overview.recent}
                    />
                )}
                {comments && (
                    <Card className="gap-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="h-4 w-4 text-primary" />
                                {t('dashboard.home.widgets.comments')}
                                {comments.count > 0 && <Badge variant="secondary">{comments.count}</Badge>}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col">
                            {comments.count === 0 ? (
                                <p className="text-sm text-muted-foreground">{t('dashboard.home.widgets.comments_empty')}</p>
                            ) : (
                                <ul className="space-y-3">
                                    {comments.latest.map((comment) => (
                                        <li key={comment.id} className="text-sm">
                                            <p className="line-clamp-2">“{comment.excerpt}”</p>
                                            <p className="text-xs text-muted-foreground">
                                                {t('dashboard.home.widgets.comment_by', {
                                                    author: comment.author ?? '—',
                                                    post: comment.post ?? '—',
                                                })}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="mt-auto pt-3">
                                <Link
                                    href={`${route('dashboard.admin.comments.index')}?status=pending`}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    {t('dashboard.home.widgets.moderate')}
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
