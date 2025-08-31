 import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { User, Role } from '../../types';
import { router } from '@inertiajs/react';
import { ROUTE } from '../../routes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEditUsers && (
            <DropdownMenuItem onClick={() => onEdit(item.id)}>
              Edit
            </DropdownMenuItem>
          )}
          {canManageRoles && (
            <DropdownMenuItem onClick={() => {
              // Placeholder for role management
            }}>
              Manage Roles
            </DropdownMenuItem>
          )}
          {canDeleteUsers && item.id !== currentUserId && (
            <DropdownMenuItem 
              className="text-red-500"
              onClick={() => {
                if (confirm(`Delete user ${item.name || item.email}? This cannot be undone.`)) {
                  router.delete(ROUTE.users.destroy(item.id), {
                    onSuccess: () => {
                      // Refresh or handle success
                    },
                    onError: () => {
                      alert('Failed to delete user');
                    },
                    preserveScroll: true,
                    preserveState: true,
                  });
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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
