import { Head, Link } from '@inertiajs/react';
import React from 'react';

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string | null;
    published_at: string;
    author: {
        id: number;
        name: string;
    } | null;
    post_type: {
        id: number;
        name: string;
        label: string;
        slug: string;
        route_prefix: string;
    };
}

interface PaginatedPosts {
    data: Post[];
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
}

interface PostsProps {
    posts: PaginatedPosts;
    pagination: Pagination;
    basePath: string;
    pageTitle: string;
    showFilters: boolean;
}

const Posts: React.FC<PostsProps> = ({ posts, pageTitle }) => {
    return (
        <>
            <Head title={pageTitle} />

            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h1 className="mb-4 text-4xl font-bold text-gray-900">Welcome to Modulo CMS</h1>
                        <p className="text-xl text-gray-600">A modern, modular content management system</p>
                    </div>

                    {posts && posts.data && posts.data.length > 0 ? (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {posts.data.map((post: Post) => (
                                <article
                                    key={post.id}
                                    className="overflow-hidden rounded-lg bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
                                >
                                    {post.featured_image && <img src={post.featured_image} alt={post.title} className="h-48 w-full object-cover" />}
                                    <div className="p-6">
                                        <div className="mb-2">
                                            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                                                {post.post_type.label}
                                            </span>
                                        </div>
                                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                                            <Link
                                                href={`/${post.post_type.route_prefix}/${post.slug}`}
                                                className="transition-colors hover:text-blue-600"
                                            >
                                                {post.title}
                                            </Link>
                                        </h2>
                                        {post.excerpt && <p className="mb-4 line-clamp-3 text-gray-600">{post.excerpt}</p>}
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            {post.author && <span>By {post.author.name}</span>}
                                            <time dateTime={post.published_at}>{new Date(post.published_at).toLocaleDateString()}</time>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-lg text-gray-600">No posts found.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Posts;
