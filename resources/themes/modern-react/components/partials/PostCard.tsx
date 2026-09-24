import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Badge, formatDate } from './ui';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featured_image?: string;
    published_at?: string;
    author?: {
        name: string;
        avatar?: string;
    };
    post_type?: {
        name?: string;
        label?: string;
        route_prefix?: string;
    };
    terms?: Array<{
        name: string;
        slug: string;
    }>;
}

interface PostCardProps {
    post: Post;
    /** Kept for backwards compatibility with templates that still pass it. */
    theme?: unknown;
    className?: string;
}

export function postUrl(post: Pick<Post, 'slug' | 'post_type'>) {
    return `/${post.post_type?.route_prefix || 'posts'}/${post.slug || ''}`;
}

export default function PostCard({ post, className }: PostCardProps) {
    if (!post || typeof post !== 'object') {
        return null;
    }

    const title = post.title || 'Untitled';
    const date = formatDate(post.published_at);
    const typeLabel = post.post_type?.label;

    return (
        <article
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[border-color,box-shadow] hover:border-input hover:shadow-md has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40',
                className,
            )}
        >
            {post.featured_image && (
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                        src={post.featured_image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                </div>
            )}

            <div className="flex flex-1 flex-col gap-3 p-5">
                {(typeLabel || date) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {typeLabel && <Badge variant="primary">{typeLabel}</Badge>}
                        {date && <time dateTime={post.published_at}>{date}</time>}
                    </div>
                )}

                <h2 className="text-lg leading-snug font-semibold tracking-tight text-foreground">
                    <Link href={postUrl(post)} className="after:absolute after:inset-0 focus-visible:outline-none">
                        {title}
                    </Link>
                </h2>

                {post.excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>}

                {post.author?.name && <p className="mt-auto pt-2 text-xs text-muted-foreground">{post.author.name}</p>}
            </div>
        </article>
    );
}
