 import { router } from '@inertiajs/react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { ROUTE } from '../../routes';

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
    <div className="space-y-3">
      <TableContainer>
        <Table dense>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((post) => (
              <TableRow key={post.id}>
                <TableCell>{post.title}</TableCell>
                <TableCell>{post.post_type?.label || post.post_type?.name}</TableCell>
                <TableCell><Badge variant="outline">{post.status}</Badge></TableCell>
                <TableCell>{post.author?.name || '—'}</TableCell>
                <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.show(post.id))}>View</Button>
                    {canEdit && (
                      <Button variant="secondary" size="sm" onClick={() => router.visit(ROUTE.posts.edit(post.id))}>Edit</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
