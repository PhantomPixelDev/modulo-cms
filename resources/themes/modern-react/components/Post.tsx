import { Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react';
import Layout from './Layout';
import PostMeta from './partials/PostMeta';

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
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

export default function Post({ post, site, theme, menus, relatedPosts }: PostProps) {
    const backUrl = post.post_type?.route_prefix ? `/${post.post_type.route_prefix}` : '/';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Layout
            title={post.meta_title || post.title}
            description={post.meta_description || post.excerpt}
            ogImage={post.featured_image}
            site={site}
            theme={theme}
            menus={menus}
        >
            <div className="py-8">
                {/* Back Navigation */}
                <div className="mb-6">
                    <Link
                        href={backUrl}
                        className="inline-flex items-center text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {post.post_type?.label || 'Posts'}
                    </Link>
                </div>

                <article className="mx-auto max-w-4xl">
                    {/* Post Header */}
                    <header className="mb-8">
                        {/* Post Type Badge */}
                        {post.post_type && post.post_type.name !== 'post' && (
                            <div className="mb-4">
                                <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white"
                                    style={{ backgroundColor: theme?.colors?.primary || '#3b82f6' }}
                                >
                                    {post.post_type.label}
                                </span>
                            </div>
                        )}

                        {/* Title */}
                        <h1 className="mb-6 text-4xl leading-tight font-bold text-gray-900 md:text-5xl">{post.title}</h1>

                        {/* Meta Information */}
                        <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                            {/* Published Date */}
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                            </div>

                            {/* Author */}
                            {post.author && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>By {post.author.name}</span>
                                </div>
                            )}

                            {/* Reading Time Estimate */}
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>{Math.ceil(post.content.split(' ').length / 200)} min read</span>
                            </div>
                        </div>

                        {/* Tags */}
                        {post.terms && post.terms.length > 0 && (
                            <div className="mb-8 flex flex-wrap gap-2">
                                {post.terms.map((term) => (
                                    <span
                                        key={term.id}
                                        className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-200"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {term.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </header>

                    {/* Featured Image */}
                    {post.featured_image && (
                        <div className="mb-8">
                            <img src={post.featured_image} alt={post.title} className="h-auto w-full rounded-lg shadow-lg" />
                        </div>
                    )}

                    {/* Post Content */}
                    <div className="prose prose-lg mb-12 max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

                    {/* Post Footer */}
                    <footer className="border-t border-gray-200 pt-8">
                        <PostMeta post={post} theme={theme} />
                    </footer>
                </article>

                {/* Related Posts */}
                {relatedPosts && relatedPosts.length > 0 && (
                    <section className="mt-16">
                        <div className="mx-auto max-w-4xl">
                            <h2 className="mb-8 text-2xl font-bold text-gray-900">Related Posts</h2>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {relatedPosts.slice(0, 3).map((relatedPost) => (
                                    <article
                                        key={relatedPost.id}
                                        className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow duration-300 hover:shadow-md"
                                    >
                                        {relatedPost.featured_image && (
                                            <div className="aspect-video overflow-hidden">
                                                <Link href={`/${relatedPost.post_type?.route_prefix || 'posts'}/${relatedPost.slug}`}>
                                                    <img
                                                        src={relatedPost.featured_image}
                                                        alt={relatedPost.title}
                                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                    />
                                                </Link>
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <h3 className="mb-2 line-clamp-2 font-semibold text-gray-900">
                                                <Link
                                                    href={`/${relatedPost.post_type?.route_prefix || 'posts'}/${relatedPost.slug}`}
                                                    className="transition-colors duration-200 hover:text-gray-700"
                                                >
                                                    {relatedPost.title}
                                                </Link>
                                            </h3>
                                            {relatedPost.excerpt && <p className="line-clamp-2 text-sm text-gray-600">{relatedPost.excerpt}</p>}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </Layout>
    );
}
