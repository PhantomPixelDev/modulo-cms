import React from 'react';
import { Head, Link } from '@inertiajs/react';

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

const Posts: React.FC<PostsProps> = ({ posts, pagination, basePath, pageTitle, showFilters }) => {
    return (
        <>
            <Head title={pageTitle} />
            
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            Welcome to Modulo CMS
                        </h1>
                        <p className="text-xl text-gray-600">
                            A modern, modular content management system
                        </p>
                    </div>

                    {posts && posts.data && posts.data.length > 0 ? (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {posts.data.map((post: Post) => (
                                <article
                                    key={post.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                                >
                                    {post.featured_image && (
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            className="w-full h-48 object-cover"
                                        />
                                    )}
                                    <div className="p-6">
                                        <div className="mb-2">
                                            <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                                                {post.post_type.label}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                                            <Link
                                                href={`/${post.post_type.route_prefix}/${post.slug}`}
                                                className="hover:text-blue-600 transition-colors"
                                            >
                                                {post.title}
                                            </Link>
                                        </h2>
                                        {post.excerpt && (
                                            <p className="text-gray-600 mb-4 line-clamp-3">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            {post.author && (
                                                <span>By {post.author.name}</span>
                                            )}
                                            <time dateTime={post.published_at}>
                                                {new Date(post.published_at).toLocaleDateString()}
                                            </time>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-600 text-lg">
                                No posts found.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Posts;
