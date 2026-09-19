import { Link } from '@inertiajs/react';
import { Calendar, Tag, User } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featured_image?: string;
    published_at: string;
    author?: {
        name: string;
        avatar?: string;
    };
    post_type?: {
        name: string;
        label: string;
        route_prefix?: string;
    };
    terms?: Array<{
        name: string;
        slug: string;
    }>;
}

interface PostCardProps {
    post: Post;
    theme?: {
        colors?: {
            primary?: string;
            secondary?: string;
        };
    };
}

export default function PostCard({ post, theme }: PostCardProps) {
    // Safety checks
    if (!post || typeof post !== 'object') {
        return null;
    }

    const safePost = {
        id: post.id || 0,
        title: post.title || 'Untitled',
        slug: post.slug || '',
        excerpt: post.excerpt,
        featured_image: post.featured_image,
        published_at: post.published_at || new Date().toISOString(),
        author: post.author,
        post_type: post.post_type,
        terms: Array.isArray(post.terms) ? post.terms : [],
    };

    const postUrl = safePost.post_type?.route_prefix ? `/${safePost.post_type.route_prefix}/${safePost.slug}` : `/posts/${safePost.slug}`;

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return 'Unknown date';
        }
    };

    return (
        <article className="group transform overflow-hidden rounded-2xl border border-white/50 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
            {/* Featured Image */}
            {safePost.featured_image && (
                <div className="aspect-video overflow-hidden">
                    <Link href={postUrl}>
                        <img
                            src={safePost.featured_image}
                            alt={safePost.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </Link>
                </div>
            )}

            <div className="p-6">
                {/* Post Type Badge */}
                {safePost.post_type && safePost.post_type.name !== 'post' && (
                    <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
                            {safePost.post_type.label}
                        </span>
                    </div>
                )}

                {/* Title */}
                <h2 className="mb-3 line-clamp-2 text-xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">
                    <Link href={postUrl} className="transition-colors duration-300 hover:text-blue-600">
                        {safePost.title}
                    </Link>
                </h2>

                {/* Excerpt */}
                {safePost.excerpt && <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{safePost.excerpt}</p>}

                {/* Meta Information */}
                <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    {/* Published Date */}
                    <div className="flex items-center gap-2 rounded-lg bg-gray-100/80 px-3 py-1.5">
                        <Calendar className="h-3 w-3 text-blue-500" />
                        <time dateTime={safePost.published_at}>{formatDate(safePost.published_at)}</time>
                    </div>

                    {/* Author */}
                    {safePost.author && (
                        <div className="flex items-center gap-2 rounded-lg bg-gray-100/80 px-3 py-1.5">
                            <User className="h-3 w-3 text-purple-500" />
                            <span>{safePost.author.name}</span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                {safePost.terms && safePost.terms.length > 0 && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {safePost.terms.slice(0, 3).map((term: any) => (
                            <span
                                key={term?.slug || Math.random()}
                                className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 transition-all duration-300 hover:bg-indigo-100"
                            >
                                <Tag className="h-3 w-3" />
                                {term?.name || 'Tag'}
                            </span>
                        ))}
                        {safePost.terms.length > 3 && (
                            <span className="rounded-lg bg-gray-100/80 px-2 py-1 text-xs text-gray-500">+{safePost.terms.length - 3} more</span>
                        )}
                    </div>
                )}

                {/* Read More Link */}
                <Link
                    href={postUrl}
                    className="inline-flex transform items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl"
                >
                    Read more
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </article>
    );
}
