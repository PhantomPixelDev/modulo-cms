import { Link } from '@inertiajs/react';
import Layout from './Layout';

interface IndexProps {
    posts?: {
        data: any[];
    };
    pagination?: any;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Index({ posts, pagination, site, theme, menus }: IndexProps) {
    const safeSite = site || { name: 'Modulo CMS', tagline: 'Modern Content Management System' };
    const safeTheme = theme || { name: 'Modern React', slug: 'modern-react', version: '1.0.0' };
    const safeMenus = menus || {};
    const recentPosts = posts?.data?.slice(0, 3) || [];

    return (
        <Layout
            title="Home"
            description={safeSite?.tagline || 'Modern Content Management System'}
            site={safeSite}
            theme={safeTheme}
            menus={safeMenus}
        >
            {/* Hero Section */}
            <div className="relative mb-16 overflow-hidden rounded-3xl bg-indigo-50 p-12 md:p-16">
                <div className="relative z-10 mx-auto max-w-4xl text-center">
                    <div className="mb-8 inline-flex items-center justify-center space-x-4">
                        <div className="flex h-16 w-16 rotate-3 transform items-center justify-center rounded-2xl bg-indigo-600 shadow-2xl">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
                                />
                            </svg>
                        </div>
                    </div>

                    <h1 className="mb-6 text-5xl leading-tight font-bold text-slate-900 md:text-6xl lg:text-7xl">{safeSite?.name || 'Modulo CMS'}</h1>

                    <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-gray-700 md:text-2xl">
                        {safeSite?.tagline || 'A powerful, modern content management system built with Laravel and React'}
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/posts"
                            className="transform rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700 hover:shadow-xl"
                        >
                            Browse Content
                        </Link>
                        <Link
                            href="/dashboard"
                            className="transform rounded-xl border border-gray-200 bg-white px-8 py-4 font-semibold text-gray-800 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                        >
                            Admin Dashboard
                        </Link>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 h-64 w-64 animate-pulse rounded-full bg-indigo-400 opacity-20 mix-blend-multiply blur-3xl filter"></div>
                <div className="absolute bottom-0 left-0 h-64 w-64 animate-pulse rounded-full bg-indigo-400 opacity-20 mix-blend-multiply blur-3xl filter delay-1000"></div>
            </div>

            {/* Features Grid */}
            <div className="mb-16">
                <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Powerful 222Featu22resddd</h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {/* Feature 1 */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                            <svg className="h-7 w-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900">Flexible Content Types</h3>
                        <p className="leading-relaxed text-gray-600">
                            Create custom post types and taxonomies to organize your content exactly how you need it.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100">
                            <svg className="h-7 w-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900">Role-Based Access</h3>
                        <p className="leading-relaxed text-gray-600">
                            Granular permissions system to control who can create, edit, and publish content.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-pink-100">
                            <svg className="h-7 w-7 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                                />
                            </svg>
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900">Modern UI/UX</h3>
                        <p className="leading-relaxed text-gray-600">
                            Beautiful, responsive interface built with React, TypeScript, and Tailwind CSS.
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Posts Section */}
            {recentPosts.length > 0 && (
                <div className="mb-16">
                    <div className="mb-8 flex items-center justify-between">
                        <h2 className="text-3xl font-bold text-gray-900">Latest Updates</h2>
                        <Link href="/posts" className="group flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
                            View all
                            <svg
                                className="h-5 w-5 transform transition-transform group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {recentPosts.map((post: any) => (
                            <Link
                                key={post.id}
                                href={`/${post.post_type?.route_prefix || 'posts'}/${post.slug}`}
                                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl"
                            >
                                {post.featured_image && (
                                    <div className="aspect-video overflow-hidden bg-indigo-100">
                                        <img
                                            src={post.featured_image}
                                            alt={post.title}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    </div>
                                )}
                                <div className="p-6">
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                            {post.post_type?.label || 'Post'}
                                        </span>
                                        {post.published_at && (
                                            <span className="text-sm text-gray-500">
                                                {new Date(post.published_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">{post.title}</h3>
                                    {post.excerpt && <p className="line-clamp-2 leading-relaxed text-gray-600">{post.excerpt}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* CTA Section */}
            <div className="rounded-3xl bg-indigo-700 p-12 text-center text-white">
                <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Get Started?</h2>
                <p className="mx-auto mb-8 max-w-2xl text-xl text-indigo-100">
                    Explore the admin dashboard to manage your content, or browse our documentation to learn more.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        href="/dashboard"
                        className="transform rounded-xl bg-white px-8 py-4 font-semibold text-blue-600 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                        Go to Dashboard
                    </Link>
                    <a
                        href="https://github.com/PhantomPixelDev/modulo-cms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transform rounded-xl border-2 border-indigo-400 bg-indigo-800 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    >
                        View on GitHub
                    </a>
                </div>
            </div>
        </Layout>
    );
}
