import { Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Tag, User } from 'lucide-react';
import Layout from './Layout';
import Comments from './partials/Comments';
import PostCard from './partials/PostCard';
import PostMeta from './partials/PostMeta';
import { Badge, formatDate, useThemeT } from './partials/ui';

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    /** Smaller WebP copies ("url 768w, …") when the image is from the media library */
    featured_image_srcset?: string | null;
    featured_image_alt?: string | null;
    published_at: string;
    updated_at: string;
    meta_title?: string;
    meta_description?: string;
    author?: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    };
    post_type?: {
        name: string;
        label: string;
        route_prefix?: string;
    };
    terms?: Array<{
        id: number;
        name: string;
        slug: string;
        taxonomy?: {
            name: string;
            label: string;
        };
    }>;
}

interface PostProps {
    post: Post;
    site?: any;
    theme?: any;
    menus?: any;
    relatedPosts?: Post[];
}

type PostWithComments = Post & { comments?: any[]; allow_comments?: boolean };

const readingMinutes = (html: string) => {
    const words = html
        .replace(/<[^>]*>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
};

export default function Post({ post, site, theme, menus, relatedPosts }: PostProps) {
    const tt = useThemeT();
    const { comments = [], allow_comments: allowComments = false } = post as PostWithComments;
    const backUrl = post.post_type?.route_prefix ? `/${post.post_type.route_prefix}` : '/';
    // "Back to Posts" reads better than the singular type label for the default post type.
    const backLabel = !post.post_type || post.post_type.name === 'post' ? tt('nav.posts', 'Posts') : post.post_type.label;
    const content = post.content || '';

    return (
        <Layout
            title={post.meta_title || post.title}
            description={post.meta_description || post.excerpt}
            ogImage={post.featured_image}
            site={site}
            theme={theme}
            menus={menus}
            post={post}
            sidebar
        >
            <article className="mx-auto max-w-3xl">
                <Link
                    href={backUrl}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    {tt('post.back_to', 'Back to :label', { label: backLabel })}
                </Link>

                <header className="mt-6 mb-8">
                    {post.post_type && post.post_type.name !== 'post' && (
                        <Badge variant="primary" className="mb-4">
                            {post.post_type.label}
                        </Badge>
                    )}

                    <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{post.title}</h1>

                    {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}

                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        {post.author && (
                            <span className="inline-flex items-center gap-1.5">
                                <User className="size-4" />
                                {tt('post.by_author', 'By :name', { name: post.author.name })}
                            </span>
                        )}
                        {post.published_at && (
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="size-4" />
                                <time dateTime={post.published_at}>{formatDate(post.published_at, { dateStyle: 'long' })}</time>
                            </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="size-4" />
                            {tt('post.reading_time', ':minutes min read', { minutes: readingMinutes(content) })}
                        </span>
                    </div>
                </header>

                {post.featured_image && (
                    <figure className="mb-10 overflow-hidden rounded-xl border bg-muted">
                        <img
                            src={post.featured_image}
                            srcSet={post.featured_image_srcset ?? undefined}
                            sizes="(min-width: 800px) 768px, 100vw"
                            alt={post.featured_image_alt ?? post.title}
                            fetchPriority="high"
                            decoding="async"
                            className="h-auto w-full"
                        />
                    </figure>
                )}

                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: content }} />

                {post.terms && post.terms.length > 0 && (
                    <div className="mt-10 flex flex-wrap gap-2">
                        {post.terms.map((term) => (
                            <Badge key={term.id} variant="outline">
                                <Tag className="size-3" />
                                {term.name}
                            </Badge>
                        ))}
                    </div>
                )}

                <footer className="mt-10 border-t pt-8">
                    <PostMeta post={post} />
                </footer>

                {(allowComments || comments.length > 0) && <Comments postId={post.id} comments={comments} allowComments={allowComments} />}
            </article>

            {relatedPosts && relatedPosts.length > 0 && (
                <section className="mx-auto mt-16 max-w-3xl border-t pt-10">
                    <h2 className="mb-6 text-xl font-semibold tracking-tight text-foreground">{tt('post.related', 'Related Posts')}</h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        {relatedPosts.slice(0, 2).map((relatedPost) => (
                            <PostCard key={relatedPost.id} post={relatedPost} />
                        ))}
                    </div>
                </section>
            )}
        </Layout>
    );
}
