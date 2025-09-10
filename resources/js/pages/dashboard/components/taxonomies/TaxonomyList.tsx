import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { TaxonomyListItem } from '../../types';

interface TaxonomyListProps {
  items: TaxonomyListItem[];
  canView?: boolean;
  canEdit?: boolean;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export function TaxonomyList({ items, canView = false, canEdit = false, onView, onEdit }: TaxonomyListProps) {
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'label', label: 'Label', sortable: true },
  ];

  const actions = (item: TaxonomyListItem) => (
    <ActionButtons
      onView={canView ? () => onView?.(item.id) : undefined}
      onEdit={canEdit ? () => onEdit?.(item.id) : undefined}
      showView={canView}
      showEdit={canEdit}
      showDelete={false}
    />
  );

  if (!items || items.length === 0) {
    return (
      <EmptyState title="No taxonomies" description="Create a taxonomy to get started." />
    );
  }

  return (
    <DataTable
      data={items}
      columns={columns}
      actions={actions}
      itemsPerPage={10}
      searchFields={['name', 'label']}
    />
  );
}
