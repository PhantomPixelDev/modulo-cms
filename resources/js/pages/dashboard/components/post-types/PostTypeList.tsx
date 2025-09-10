import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { PostTypeListItem } from '../../types';

interface PostTypeListProps {
  items: PostTypeListItem[];
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (item: PostTypeListItem) => void;
}

export function PostTypeList({ items, canView = false, canEdit = false, canDelete = false, onView, onEdit, onDelete }: PostTypeListProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState title="No post types" description="Create a post type to get started." />
    );
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'label', label: 'Label', sortable: true },
    { key: 'route_prefix', label: 'Route Prefix', sortable: true },
  ];

  const actions = (item: PostTypeListItem) => (
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
      searchFields={['name', 'label', 'route_prefix']}
    />
  );
}
