import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { RoleList, RoleForm } from '../../components/roles';

export function getRolesSections({
  roles,
  editRole,
  permissionsWithTimestamps,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  roles: any[];
  editRole: any;
  permissionsWithTimestamps: any[];
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const handleRoleSubmit = async (data: any) => {
    const url = editRole ? ROUTE.roles.update(editRole.id) : ROUTE.roles.store();
    const method = editRole ? 'put' : 'post';

    try {
      await router[method](url, data, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(
            t(
              editRole
                ? 'dashboard.roles.messages.updated'
                : 'dashboard.roles.messages.created'
            )
          );
          router.visit(ROUTE.roles.index());
        },
        onError: (errors) => {
          console.error('Failed to save role:', errors);
          showError(
            t(
              editRole
                ? 'dashboard.roles.messages.update_failed'
                : 'dashboard.roles.messages.create_failed'
            )
          );
        },
      });
    } catch (error) {
      console.error('Error saving role:', error);
      showError(
        t(
          editRole
            ? 'dashboard.roles.messages.update_failed'
            : 'dashboard.roles.messages.create_failed'
        )
      );
    }
  };

  const renderRolesList = () => (
    <SectionWrapper
      title={t('dashboard.roles.title')}
      description={t('dashboard.roles.description')}
      actions={
        can('create roles') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.roles.create())}>
            {t('dashboard.roles.actions.new')}
          </Button>
        ) : null
      }
    >
      <RoleList roles={roles} onEdit={(id) => router.visit(ROUTE.roles.edit(id))} />
    </SectionWrapper>
  );

  const renderRoleCreateEdit = () => (
    <SectionWrapper
      title={editRole ? t('dashboard.roles.edit_title') : t('dashboard.roles.create_title')}
      description={editRole ? t('dashboard.roles.edit_description') : t('dashboard.roles.create_description')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.roles.index())}>
          {t('dashboard.roles.actions.back')}
        </Button>
      }
    >
      <RoleForm
        role={editRole}
        allPermissions={permissionsWithTimestamps}
        isEditing={!!editRole}
        onSubmit={handleRoleSubmit}
        onCancel={() => router.visit(ROUTE.roles.index())}
      />
    </SectionWrapper>
  );

  return {
    roles: renderRolesList,
    'roles.create': renderRoleCreateEdit,
    'roles.edit': renderRoleCreateEdit,
  };
}
