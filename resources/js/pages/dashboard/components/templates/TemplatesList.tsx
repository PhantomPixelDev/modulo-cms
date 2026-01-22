import * as React from 'react';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';

export interface TemplateListItem {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  is_default?: boolean;
  is_active?: boolean;
}

export function TemplatesList({
  items,
  canView = false,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
}: {
  items: TemplateListItem[];
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (item: TemplateListItem) => void;
}) {
  if (!items || items.length === 0) {
    return <EmptyState title="No templates" description="Create a template to get started." />;
  }

  const columns = [
    { key: 'type', label: 'Type', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'is_default', label: 'Default', sortable: true },
    { key: 'is_active', label: 'Active', sortable: true },
  ];

  const actions = (item: TemplateListItem) => (
    <ActionButtons
      onView={canView ? () => onView?.(item.id) : undefined}
      onEdit={canEdit ? () => onEdit?.(item.id) : undefined}
      onDelete={canDelete ? () => onDelete?.(item) : undefined}
      showView={canView}
      showEdit={canEdit}
      showDelete={canDelete}
    />
  );

  return (
    <DataTable
      data={items}
      columns={columns}
      actions={actions}
      itemsPerPage={10}
      searchFields={['name', 'slug', 'type']}
    />
  );
}
