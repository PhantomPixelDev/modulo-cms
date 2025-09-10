 import React from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { EmptyState } from '../common/EmptyState';
import { PostListItem } from '../../types';
import { ROUTE } from '../../routes';

type PostListProps = {
  posts: PostListItem[] | { data: PostListItem[] };
  canCreate?: boolean;
  canEdit?: boolean;
  onCreate?: () => void;
};

export function PostList({ posts, canCreate = false, canEdit = false, onCreate }: PostListProps) {
  const items: PostListItem[] = Array.isArray(posts) ? posts : posts?.data || [];

  const columns = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'post_type', label: 'Type', sortable: false, render: (item: PostListItem) => item.post_type?.label || item.post_type?.name || '—' },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'author', label: 'Author', sortable: false, render: (item: PostListItem) => item.author?.name || '—' },
    { key: 'created_at', label: 'Created', sortable: true, render: (item: PostListItem) => new Date(item.created_at).toLocaleDateString() },
  ];

  const actions = (item: PostListItem) => (
    <ActionButtons
      onView={() => router.visit(ROUTE.posts.show(item.id))}
      onEdit={canEdit ? () => router.visit(ROUTE.posts.edit(item.id)) : undefined}
      showView={true}
      showEdit={canEdit}
      showDelete={false}
    />
  );

  return (
    <div className="space-y-3">
      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={onCreate}>Create Post</Button>
        </div>
      )}
      <DataTable
        data={items}
        columns={columns}
        actions={actions}
        itemsPerPage={10}
        searchFields={['title']}
      />
    </div>
  );
}
