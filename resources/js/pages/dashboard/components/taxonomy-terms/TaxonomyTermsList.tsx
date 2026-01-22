import * as React from 'react';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';

export interface TaxonomyTermListItem {
  id: number;
  name: string;
  slug: string;
  term_order?: number;
  taxonomy?: { id: number; name: string; label: string; slug: string };
}

export function TaxonomyTermsList({
  items,
  canView = false,
  canEdit = false,
  canDelete = false,
  onView,
  onEdit,
  onDelete,
}: {
  items: TaxonomyTermListItem[];
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (item: TaxonomyTermListItem) => void;
}) {
  if (!items || items.length === 0) {
    return <EmptyState title="No taxonomy terms" description="Create a taxonomy term to get started." />;
  }

  const columns = [
    { key: 'taxonomy', label: 'Taxonomy', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'term_order', label: 'Order', sortable: true },
  ];

  const actions = (item: TaxonomyTermListItem) => (
    <ActionButtons
      onView={canView ? () => onView?.(item.id) : undefined}
      onEdit={canEdit ? () => onEdit?.(item.id) : undefined}
      onDelete={canDelete ? () => onDelete?.(item) : undefined}
      showView={canView}
      showEdit={canEdit}
      showDelete={canDelete}
    />
  );

  const rows = items.map((t) => ({
    ...t,
    taxonomy: t.taxonomy?.label ?? t.taxonomy?.name ?? '',
  }));

  return (
    <DataTable
      data={rows as any}
      columns={columns}
      actions={actions}
      itemsPerPage={10}
      searchFields={['name', 'slug', 'taxonomy']}
    />
  );
}
