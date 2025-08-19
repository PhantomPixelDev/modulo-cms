import { Badge } from '@/components/ui/badge';

interface PostViewProps {
  post: {
    id: number;
    title: string;
    slug: string;
    status: string;
    content: string;
    excerpt?: string;
    created_at?: string;
    updated_at?: string;
    published_at?: string | null;
    featured_image?: string | null;
    post_type?: { id: number; name: string; label: string };
    author?: { id: number; name: string } | null;
  };
}

export function PostView({ post }: PostViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{post.post_type?.label || post.post_type?.name}</Badge>
        <Badge variant="outline">{post.status}</Badge>
        {post.published_at && <span className="text-sm text-muted-foreground">Published: {new Date(post.published_at).toLocaleString()}</span>}
      </div>
      {post.excerpt && <p className="text-muted-foreground">{post.excerpt}</p>}
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
}
