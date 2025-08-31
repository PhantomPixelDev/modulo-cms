 import React from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
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
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.show(item.id))}>View</Button>
      {canEdit && (
        <Button variant="secondary" size="sm" onClick={() => router.visit(ROUTE.posts.edit(item.id))}>Edit</Button>
      )}
    </div>
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
