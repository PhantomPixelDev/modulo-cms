 import React from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/ui/table-actions';
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
    <ActionButtons
      onEdit={() => onEdit(item.id)}
      showEdit={true}
      showDelete={false}
      showView={false}
      size="sm"
    />
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
