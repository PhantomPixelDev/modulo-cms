import React from 'react';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { PageListItem } from '../../types';
import { useTranslation } from '@/hooks/useTranslation';

interface PagesListProps {
  pages: PageListItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (item: PageListItem) => void;
};

export function PagesList({ pages, canEdit = false, canDelete = false, onEdit, onDelete }: PagesListProps) {
  const { t } = useTranslation();
  if (!pages || pages.length === 0) {
    return (
      <EmptyState
        title={t('dashboard.pages.empty.title')}
        description={t('dashboard.pages.empty.description')}
      />
    );
  }

  const columns = [
    { key: 'title', label: t('dashboard.pages.table.title'), sortable: true },
    { key: 'status', label: t('dashboard.pages.table.status'), sortable: true },
    {
      key: 'author',
      label: t('dashboard.pages.table.author'),
      sortable: false,
      render: (item: PageListItem) => item.author?.name || t('dashboard.pages.table.author_fallback'),
    },
    {
      key: 'created_at',
      label: t('dashboard.pages.table.created'),
      sortable: true,
      render: (item: PageListItem) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  const actions = (item: PageListItem) => (
    <ActionButtons
      onEdit={canEdit ? () => onEdit?.(item.id) : undefined}
      onDelete={canDelete ? () => onDelete?.(item) : undefined}
      showEdit={canEdit}
      showDelete={canDelete}
      showView={false}
    />
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
