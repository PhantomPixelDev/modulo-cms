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
}: {
  roles: any[];
  editRole: any;
  permissionsWithTimestamps: any[];
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const handleRoleSubmit = async (data: any) => {
    const url = editRole ? ROUTE.roles.update(editRole.id) : ROUTE.roles.store();
    const method = editRole ? 'put' : 'post';

    try {
      await router[method](url, data, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Role ${editRole ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.roles.index());
        },
        onError: (errors) => {
          console.error('Failed to save role:', errors);
          showError(`Failed to ${editRole ? 'update' : 'create'} role`);
        },
      });
    } catch (error) {
      console.error('Error saving role:', error);
      showError(`Failed to ${editRole ? 'update' : 'create'} role`);
    }
  };

  const renderRolesList = () => (
    <SectionWrapper
      title="Roles"
      actions={
        can('create roles') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.roles.create())}>
            + New Role
          </Button>
        ) : null
      }
    >
      <RoleList roles={roles} onEdit={(id) => router.visit(ROUTE.roles.edit(id))} />
    </SectionWrapper>
  );

  const renderRoleCreateEdit = () => (
    <SectionWrapper
      title={editRole ? 'Edit Role' : 'Create New Role'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.roles.index())}>
          Back to Roles
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
