import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type PostListItem = {
  id: number;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  post_type: { id: number; name: string; label: string };
  author?: { id: number; name: string } | null;
};

interface PostListProps {
  posts: { data: PostListItem[]; total?: number } | PostListItem[];
  canCreate?: boolean;
  canEdit?: boolean;
  onCreate?: () => void;
}

export function PostList({ posts, canCreate = false, canEdit = false, onCreate }: PostListProps) {
  const items: PostListItem[] = Array.isArray(posts) ? posts : posts?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{Array.isArray(posts) ? items.length : posts?.total ?? items.length} posts</div>
        {canCreate && (
          <Button size="sm" onClick={onCreate}>+ New Post</Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Author</th>
              <th className="py-2 pr-4">Created</th>
              <th className="py-2 pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((post) => (
              <tr key={post.id} className="border-b last:border-b-0 hover:bg-accent dark:hover:bg-gray-800">
                <td className="py-2 pr-4">{post.title}</td>
                <td className="py-2 pr-4">{post.post_type?.label || post.post_type?.name}</td>
                <td className="py-2 pr-4"><Badge variant="outline">{post.status}</Badge></td>
                <td className="py-2 pr-4">{post.author?.name || '—'}</td>
                <td className="py-2 pr-4">{new Date(post.created_at).toLocaleDateString()}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('dashboard.admin.posts.show', { post: post.id }))}>View</Button>
                    {canEdit && (
                      <Button variant="secondary" size="sm" onClick={() => router.visit(route('dashboard.admin.posts.edit', { post: post.id }))}>Edit</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
