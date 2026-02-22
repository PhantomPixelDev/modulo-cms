import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { UserList, UserForm } from '../../components/users';

export function getUsersSections({
  users,
  auth,
  allRoles,
  permissions,
  editUser,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  users: any[];
  auth: any;
  allRoles: any;
  permissions: any;
  editUser: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const handleUserSubmit = async (formData: any) => {
    try {
      const url = editUser ? ROUTE.users.update(editUser.id) : ROUTE.users.store();
      const method = editUser ? 'put' : 'post';

      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(
            t(
              editUser
                ? 'dashboard.users.messages.updated'
                : 'dashboard.users.messages.created'
            )
          );
          router.visit(ROUTE.users.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(
            t(
              editUser
                ? 'dashboard.users.messages.update_failed'
                : 'dashboard.users.messages.create_failed'
            )
          );
        },
      });
    } catch (error) {
      console.error('Error saving user:', error);
      showError(
        t(
          editUser
            ? 'dashboard.users.messages.update_failed'
            : 'dashboard.users.messages.create_failed'
        )
      );
    }
  };

  const renderUsersList = () => (
    <SectionWrapper
      title={t('dashboard.users.title')}
      description={t('dashboard.users.description')}
      actions={
        can('create users') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.users.create())}>
            {t('dashboard.users.actions.new')}
          </Button>
        ) : null
      }
    >
      <UserList
        users={users}
        onEdit={(id) => router.visit(ROUTE.users.edit(id))}
        onRoleChange={async (userId: number, roleId: number, action: 'assign' | 'remove') => {
          try {
            const url = action === 'assign'
              ? ROUTE.users.roles.assign(userId, roleId)
              : ROUTE.users.roles.remove(userId, roleId);
            await router.post(url, {}, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(
                  t(
                    action === 'assign'
                      ? 'dashboard.users.messages.role_assigned'
                      : 'dashboard.users.messages.role_removed'
                  )
                );
                router.reload({ only: ['users'] });
              },
              onError: () => showError(t('dashboard.users.messages.role_failed')),
            });
          } catch (error) {
            console.error('Error updating user role:', error);
            showError(t('dashboard.users.messages.role_error'));
          }
        }}
        currentUserId={auth.user?.id}
        canEditUsers={can('edit users')}
        canDeleteUsers={can('delete users')}
        canManageRoles={can('assign roles')}
      />
    </SectionWrapper>
  );

  const renderUserCreate = () => (
    <SectionWrapper
      title={t('dashboard.users.create_title')}
      description={t('dashboard.users.create_description')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.users.index())}>
          {t('dashboard.users.actions.back')}
        </Button>
      }
    >
      <UserForm
        allRoles={allRoles || []}
        isEditing={false}
        permissions={permissions}
        onSubmit={handleUserSubmit}
        onCancel={() => router.visit(ROUTE.users.index())}
        currentUserId={auth.user?.id}
      />
    </SectionWrapper>
  );

  const renderUserEdit = () => {
    if (!editUser) {
      return (
        <SectionWrapper title={t('dashboard.users.not_found.title')}>
          <p>{t('dashboard.users.not_found.description')}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(ROUTE.users.index())}
            className="mt-4"
          >
            {t('dashboard.users.actions.back')}
          </Button>
        </SectionWrapper>
      );
    }

    return (
      <SectionWrapper
        title={t('dashboard.users.edit_title')}
        description={t('dashboard.users.edit_description')}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.users.index())}>
            {t('dashboard.users.actions.back')}
          </Button>
        }
      >
        <UserForm
          user={{
            ...editUser,
            email_verified_at: 'email_verified_at' in editUser ? editUser.email_verified_at : null,
            roles: (editUser.roles || []).map((role: any) => ({
              ...role,
              created_at: role.created_at || new Date().toISOString(),
              updated_at: role.updated_at || new Date().toISOString(),
            })),
          }}
          allRoles={(allRoles || []).map((role: any) => ({
            ...role,
            created_at: role.created_at || new Date().toISOString(),
            updated_at: role.updated_at || new Date().toISOString(),
          }))}
          isEditing={true}
          permissions={permissions}
          onSubmit={handleUserSubmit}
          onCancel={() => router.visit(ROUTE.users.index())}
          currentUserId={auth.user?.id}
        />
      </SectionWrapper>
    );
  };

  return {
    users: renderUsersList,
    'users.create': renderUserCreate,
    'users.edit': renderUserEdit,
  };
}
