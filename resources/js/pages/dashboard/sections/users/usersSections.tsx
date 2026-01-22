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
}): Record<string, () => ReactNode> {
  const handleUserSubmit = async (formData: any) => {
    try {
      const url = editUser ? ROUTE.users.update(editUser.id) : ROUTE.users.store();
      const method = editUser ? 'put' : 'post';

      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`User ${editUser ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.users.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${editUser ? 'update' : 'create'} user`);
        },
      });
    } catch (error) {
      console.error('Error saving user:', error);
      showError(`Failed to ${editUser ? 'update' : 'create'} user`);
    }
  };

  const renderUsersList = () => (
    <SectionWrapper
      title="Users"
      actions={
        can('create users') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.users.create())}>
            + New User
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
                showSuccess(`Role ${action === 'assign' ? 'assigned' : 'removed'} successfully`);
                router.reload({ only: ['users'] });
              },
              onError: () => showError(`Failed to ${action} role`),
            });
          } catch (error) {
            console.error('Error updating user role:', error);
            showError('An error occurred while updating the role');
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
      title="Create New User"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.users.index())}>
          Back to Users
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
        <SectionWrapper title="User Not Found">
          <p>User not found. Please try again.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.visit(ROUTE.users.index())}
            className="mt-4"
          >
            Back to Users
          </Button>
        </SectionWrapper>
      );
    }

    return (
      <SectionWrapper
        title="Edit User"
        actions={
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.users.index())}>
            Back to Users
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
