 import React from 'react';
import { ActionButtons } from '@/components/ui/table-actions';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { Role } from '../../types';
import { useTranslation } from '@/hooks/useTranslation';

type RoleListProps = {
  roles: Role[];
  onEdit: (id: number) => void;
};

export function RoleList({ roles, onEdit }: RoleListProps) {
  const { t } = useTranslation();
  const columns = [
    { key: 'name', label: t('dashboard.roles.table.name'), sortable: true },
    { key: 'permissions', label: t('dashboard.roles.table.permissions'), sortable: false, render: (item: Role) => (
      <div className="flex flex-wrap gap-1">
        {(item.permissions || []).slice(0, 3).map((p) => (
          <Badge key={p.id} variant="outline">{p.name}</Badge>
        ))}
        {(item.permissions || []).length > 3 && (
          <Badge variant="outline">
            {t('dashboard.roles.table.more_permissions', { count: (item.permissions || []).length - 3 })}
          </Badge>
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
