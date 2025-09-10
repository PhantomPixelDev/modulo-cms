 import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/ui/table-actions';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { User, Role } from '../../types';
import { router } from '@inertiajs/react';
import { ROUTE } from '../../routes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2 } from 'lucide-react';

type UserListProps = {
  users: User[];
  onEdit: (id: number) => void;
  onRoleChange?: (userId: number, roleIds: number[]) => void;
  currentUserId?: number;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canManageRoles?: boolean;
};

export function UserList({
  users,
  onEdit,
  onRoleChange = () => {},
  currentUserId = -1,
  canEditUsers = false,
  canDeleteUsers = false,
  canManageRoles = false
}: UserListProps) {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'roles', label: 'Roles', sortable: false, render: (item: User) => (
      <div className="flex flex-wrap gap-1">
        {(item.roles || []).map((r) => (
          <Badge key={r.id} variant="outline">{r.name}</Badge>
        ))}
      </div>
    )},
    { key: 'created_at', label: 'Joined', sortable: true, render: (item: User) => new Date(item.created_at).toLocaleDateString() },
  ];

  const actions = (item: User) => (
    <div className="flex justify-end">
      <ActionButtons
        onEdit={canEditUsers ? () => onEdit(item.id) : undefined}
        onDelete={canDeleteUsers && item.id !== currentUserId ? () => {
          if (confirm('Are you sure you want to delete this user?')) {
            router.delete(ROUTE.users.destroy(item.id));
          }
        } : undefined}
        showEdit={canEditUsers}
        showDelete={canDeleteUsers && item.id !== currentUserId}
        showView={false}
        size="sm"
      />
    </div>
  );

  return (
    <DataTable
      data={users}
      columns={columns}
      actions={actions}
      itemsPerPage={10}
      searchFields={['name', 'email']}
    />
  );
}
