 import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { Role } from '../../types';

type RoleListProps = {
  roles: Role[];
  onEdit: (id: number) => void;
};

export function RoleList({ roles, onEdit }: RoleListProps) {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'permissions', label: 'Permissions', sortable: false, render: (item: Role) => (
      <div className="flex flex-wrap gap-1">
        {(item.permissions || []).slice(0, 3).map((p) => (
          <Badge key={p.id} variant="outline">{p.name}</Badge>
        ))}
        {(item.permissions || []).length > 3 && (
          <Badge variant="outline">+{(item.permissions || []).length - 3} more</Badge>
        )}
      </div>
    )},
  ];

  const actions = (item: Role) => (
    <div className="flex space-x-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2"
        onClick={() => onEdit(item.id)}
      >
        Edit
      </Button>
    </div>
  );

  return (
    <DataTable
      data={roles}
      columns={columns}
      actions={actions}
      itemsPerPage={10}
      searchFields={['name']}
    />
  );
}
