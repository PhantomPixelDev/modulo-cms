import type { AclUser } from '@/lib/acl';
import { router } from '@inertiajs/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardCreatePostButton, DashboardQuickActions } from './DashboardActions';

vi.mock('@inertiajs/react', () => ({ router: { visit: vi.fn() } }));

const routes = {
    posts: { create: () => '/dashboard/admin/posts/create' },
    pages: { create: () => '/dashboard/admin/pages/create' },
    users: { create: () => '/dashboard/admin/users/create' },
    media: { index: () => '/dashboard/admin/media' },
    themes: { index: () => '/dashboard/admin/themes' },
    siteSettings: { index: () => '/dashboard/admin/settings' },
};
function home(permissions: string[], role = 'editor') {
    const user: AclUser = {
        id: 1,
        name: 'Demo Editor',
        email: 'editor@example.test',
        roles: [{ id: 1, name: role }],
        permissions: permissions.map((name, id) => ({ id, name })),
    };
    const t = (key: string) => key;
    return (
        <>
            <DashboardCreatePostButton user={user} create={routes.posts.create} t={t} />
            <DashboardQuickActions user={user} routes={routes} t={t} />
        </>
    );
}
describe('dashboard action permissions', () => {
    it('lets an editor create content without offering inaccessible management screens', () => {
        render(home(['access admin', 'create posts', 'create pages', 'view media']));
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.home.quick_actions.new_page' }));
        expect(router.visit).toHaveBeenCalledWith('/dashboard/admin/pages/create');
        fireEvent.click(screen.getByRole('button', { name: 'dashboard.home.cta_create_post' }));
        expect(router.visit).toHaveBeenCalledWith('/dashboard/admin/posts/create');
        for (const action of ['add_user', 'themes', 'settings']) {
            expect(screen.queryByRole('button', { name: `dashboard.home.quick_actions.${action}` })).not.toBeInTheDocument();
        }
    });
    it('does not show content or management shortcuts to a normal user', () => {
        render(home([], 'user'));
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.queryByText('dashboard.home.quick_actions_header')).not.toBeInTheDocument();
    });
    it('requires admin access as well as the individual action permission', () => {
        render(home(['create posts'], 'user'));
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
    it('retains all working shortcuts for administrators even without explicit permission records', () => {
        render(home([], 'super-admin'));
        expect(screen.getAllByRole('button')).toHaveLength(7);
        for (const [name, path] of [
            ['new_post', '/dashboard/admin/posts/create'],
            ['new_page', '/dashboard/admin/pages/create'],
            ['add_user', '/dashboard/admin/users/create'],
            ['media', '/dashboard/admin/media'],
            ['themes', '/dashboard/admin/themes'],
            ['settings', '/dashboard/admin/settings'],
        ]) {
            fireEvent.click(screen.getByRole('button', { name: `dashboard.home.quick_actions.${name}` }));
            expect(router.visit).toHaveBeenLastCalledWith(path);
        }
    });
});
