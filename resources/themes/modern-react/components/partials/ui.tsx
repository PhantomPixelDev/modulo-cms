import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import React from 'react';

/*
 * Small building blocks shared by the Modern React templates. They only
 * use the site design tokens (bg-background, text-muted-foreground, …), so
 * every template picks up light/dark mode and the brand colour for free.
 */

export interface MenuItem {
    id?: number | string;
    label?: string;
    title?: string;
    url?: string;
    target?: string | null;
    children?: MenuItem[];
}

/** Accepts a menu tree, a bare item array, or `{ items }` / `{ data }` wrappers. */
export function normalizeMenuItems(menuData: unknown): MenuItem[] {
    if (!menuData) return [];
    const source = Array.isArray(menuData)
        ? menuData
        : typeof menuData === 'object'
          ? ((menuData as { items?: unknown }).items ?? (menuData as { data?: unknown }).data)
          : null;

    return Array.isArray(source) ? source.filter((item): item is MenuItem => !!item && typeof item === 'object') : [];
}

export function isExternalUrl(url: string): boolean {
    return /^(https?:)?\/\//.test(url) || url.startsWith('mailto:') || url.startsWith('tel:');
}

/** Theme strings live under `theme.*`; fall back to English when a key is missing. */
export function useThemeT() {
    const { t } = useTranslation();
    return (key: string, fallback: string, replacements: Record<string, string | number> = {}) => {
        const value = t(`theme.${key}`, replacements, '');
        if (value) return value;
        return Object.entries(replacements).reduce((text, [k, v]) => text.replace(`:${k}`, String(v)), fallback);
    };
}

export function formatDate(value?: string | null, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, options);
}

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)} {...props} />;
}

interface PageHeaderProps {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
    return (
        <header className={cn('mb-10 flex flex-col gap-4 border-b pb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="max-w-2xl space-y-2">
                {eyebrow && <p className="text-sm font-medium text-primary">{eyebrow}</p>}
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
                {description && <p className="text-base text-muted-foreground sm:text-lg">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    );
}

const buttonVariants = {
    primary: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
    outline: 'border border-input bg-background text-foreground shadow-xs hover:bg-accent',
    ghost: 'text-foreground hover:bg-accent',
} as const;

const buttonSizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
} as const;

export function buttonClass(variant: keyof typeof buttonVariants = 'primary', size: keyof typeof buttonSizes = 'md', className?: string | false) {
    return cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        buttonVariants[variant],
        buttonSizes[size],
        className,
    );
}

interface ButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    variant?: keyof typeof buttonVariants;
    size?: keyof typeof buttonSizes;
}

export function ButtonLink({ href, variant = 'primary', size = 'md', className, children, ...props }: ButtonLinkProps) {
    const classes = buttonClass(variant, size, className);
    if (isExternalUrl(href) || props.target === '_blank') {
        return (
            <a href={href} className={classes} {...props}>
                {children}
            </a>
        );
    }
    return (
        <Link href={href} className={classes} {...(props as Record<string, unknown>)}>
            {children}
        </Link>
    );
}

const badgeVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/12 text-success',
    warning: 'bg-warning/15 text-warning-foreground dark:text-warning',
    destructive: 'bg-destructive/10 text-destructive',
    outline: 'border text-foreground',
} as const;

export function Badge({
    variant = 'default',
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof badgeVariants }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap',
                badgeVariants[variant],
                className,
            )}
            {...props}
        />
    );
}

interface EmptyStateProps {
    icon?: LucideIcon;
    title: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center rounded-xl border border-dashed px-6 py-16 text-center', className)}>
            {Icon && (
                <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                </div>
            )}
            <p className="font-medium text-foreground">{title}</p>
            {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

export interface PaginationData {
    current_page?: number;
    last_page?: number;
    prev_page_url?: string | null;
    next_page_url?: string | null;
}

export function Pagination({ pagination, className }: { pagination?: PaginationData | null; className?: string }) {
    const tt = useThemeT();
    const current = Number(pagination?.current_page ?? 1);
    const last = Number(pagination?.last_page ?? 1);
    if (!pagination || last <= 1) return null;

    const prev = pagination.prev_page_url ?? (current > 1 ? `?page=${current - 1}` : null);
    const next = pagination.next_page_url ?? (current < last ? `?page=${current + 1}` : null);
    const disabled = 'pointer-events-none opacity-40';

    return (
        <nav className={cn('mt-12 flex items-center justify-between gap-4 border-t pt-6', className)} aria-label="Pagination">
            <a href={prev ?? undefined} aria-disabled={!prev} className={buttonClass('outline', 'sm', !prev && disabled)}>
                <ChevronLeft />
                {tt('buttons.previous', 'Previous')}
            </a>
            <span className="text-sm text-muted-foreground tabular-nums">
                {tt('posts.pagination', 'Page :current of :total', { current, total: last })}
            </span>
            <a href={next ?? undefined} aria-disabled={!next} className={buttonClass('outline', 'sm', !next && disabled)}>
                {tt('buttons.next', 'Next')}
                <ChevronRight />
            </a>
        </nav>
    );
}

/** Uppercase-free section heading used inside cards and sidebars. */
export function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn('text-lg font-semibold tracking-tight text-foreground', className)} {...props} />;
}
