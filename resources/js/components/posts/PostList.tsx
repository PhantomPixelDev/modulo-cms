import React from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  published_at: string;
  featured_image?: string;
  author?: {
    id: number;
    name: string;
  };
  post_type?: {
    id: number;
    name: string;
    slug: string;
    route_prefix?: string;
  };
}

interface PostListProps {
  posts: Post[];
}

function getPostUrl(post: Post): string {
  // If no post_type or route_prefix is null/empty, use /posts/ for regular posts
  if (!post.post_type?.route_prefix) {
    return `/posts/${post.slug}`;
  }
  
  // Use the route_prefix for other post types
  return `/${post.post_type.route_prefix}/${post.slug}`;
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No posts found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <Link 
          key={post.id} 
          href={getPostUrl(post)}
          className="group block h-full"
        >
          <Card className="h-full flex flex-col transition-shadow hover:shadow-lg">
            {post.featured_image && (
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {post.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {post.published_at && (
                  <time dateTime={post.published_at}>
                    {format(new Date(post.published_at), 'MMMM d, yyyy')}
                  </time>
                )}
                {post.author && (
                  <>
                    <span>•</span>
                    <span>{post.author.name}</span>
                  </>
                )}
              </div>
            </CardHeader>
            {post.excerpt && (
              <CardContent className="flex-1">
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt}
                </p>
              </CardContent>
            )}
            <CardFooter>
              <span className="text-sm font-medium text-primary group-hover:underline">
                Read more
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default PostList;
