import React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { PageListItem } from '../../types';

interface PagesListProps {
  pages: PageListItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (item: PageListItem) => void;
};

export function PagesList({ pages, canEdit = false, canDelete = false, onEdit, onDelete }: PagesListProps) {
  if (!pages || pages.length === 0) {
    return (
      <EmptyState title="No pages" description="Create a page to get started." />
    );
  }

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'author', label: 'Author', sortable: false, render: (item: PageListItem) => item.author?.name || '—' },
    { key: 'created_at', label: 'Created', sortable: true, render: (item: PageListItem) => new Date(item.created_at).toLocaleDateString() },
  ];

  const actions = (item: PageListItem) => (
    <div className="flex gap-2">
      {canEdit && (
        <Button size="sm" onClick={() => onEdit?.(item.id)}>Edit</Button>
      )}
      {canDelete && (
        <Button variant="destructive" size="sm" onClick={() => onDelete?.(item)}>Delete</Button>
      )}
    </div>
  );

  return (
    <DataTable
      data={pages}
      columns={columns}
      actions={actions}
      itemsPerPage={10}
      searchFields={['title']}
    />
  );
}
