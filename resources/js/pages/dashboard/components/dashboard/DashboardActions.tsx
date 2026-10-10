import { Button } from '@/components/ui/button';
import { hasAnyRoleFrom, hasPermissionFrom, type AclUser } from '@/lib/acl';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { FileText, ImageIcon, Palette, PenSquare, Settings, UserPlus } from 'lucide-react';

type TranslateFn = (key: string) => string;
interface ActionRoutes {
    posts: { create: () => string };
    pages: { create: () => string };
    users: { create: () => string };
    media: { index: () => string };
    themes: { index: () => string };
    siteSettings: { index: () => string };
}

function canUseAction(user: AclUser, permission: string): boolean {
    return hasAnyRoleFrom(user, ['admin', 'super-admin']) || (hasPermissionFrom(user, 'access admin') && hasPermissionFrom(user, permission));
}

export function DashboardCreatePostButton({ user, create, t }: { user: AclUser; create: () => string; t: TranslateFn }) {
    if (!canUseAction(user, 'create posts')) return null;
    return (
        <Button onClick={() => router.visit(create())} className="self-start sm:self-auto">
            <PenSquare />
            {t('dashboard.home.cta_create_post')}
        </Button>
    );
}

export function DashboardQuickActions({ user, routes, t }: { user: AclUser; routes: ActionRoutes; t: TranslateFn }) {
    const actions = [
        { name: 'new_post', icon: PenSquare, href: routes.posts.create, permission: 'create posts', color: 'text-blue-600 dark:text-blue-400' },
        { name: 'new_page', icon: FileText, href: routes.pages.create, permission: 'create pages', color: 'text-violet-600 dark:text-violet-400' },
        { name: 'add_user', icon: UserPlus, href: routes.users.create, permission: 'create users', color: 'text-emerald-600 dark:text-emerald-400' },
        { name: 'media', icon: ImageIcon, href: routes.media.index, permission: 'view media', color: 'text-amber-600 dark:text-amber-400' },
        { name: 'themes', icon: Palette, href: routes.themes.index, permission: 'view themes', color: 'text-pink-600 dark:text-pink-400' },
        { name: 'settings', icon: Settings, href: routes.siteSettings.index, permission: 'view settings', color: 'text-muted-foreground' },
    ].filter((action) => canUseAction(user, action.permission));
    if (actions.length === 0) return null;
    return (
        <div>
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold">{t('dashboard.home.quick_actions_header')}</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {actions.map(({ name, icon: Icon, href, color }) => (
                    <button
                        key={name}
                        type="button"
                        onClick={() => router.visit(href())}
                        className="group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 shadow-xs transition-colors outline-none hover:border-input hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                        <Icon className={cn('size-5 transition-transform group-hover:-translate-y-0.5', color)} />
                        <span className="text-xs font-medium text-foreground">{t(`dashboard.home.quick_actions.${name}`)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
