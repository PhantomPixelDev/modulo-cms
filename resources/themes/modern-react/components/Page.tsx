import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Layout from './Layout';

interface Page {
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
}

interface PageProps {
    page: Page;
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Page({ page, site, theme, menus }: PageProps) {
    // Ensure safe defaults to prevent Object.keys errors
    const safePage = page || { title: 'Untitled', content: '', published_at: new Date().toISOString() };
    const safeSite = site || { name: 'Modulo CMS' };
    const safeTheme = theme || { colors: { primary: '#3b82f6' } };
    const safeMenus = menus || { primary: [], footer: [] };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Layout
            title={safePage.meta_title || safePage.title}
            description={safePage.meta_description || safePage.excerpt}
            ogImage={safePage.featured_image}
            site={safeSite}
            theme={safeTheme}
            menus={safeMenus}
        >
            <div className="py-8">
                {/* Back Navigation */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm text-gray-600 transition-colors duration-200 hover:text-gray-900">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Home
                    </Link>
                </div>

                <article className="mx-auto max-w-4xl">
                    {/* Page Header */}
                    <header className="mb-8">
                        {/* Title */}
                        <h1 className="mb-6 text-4xl leading-tight font-bold text-gray-900 md:text-5xl">{safePage.title}</h1>

                        {/* Meta Information */}
                        <div className="mb-6 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                            {/* Published Date */}
                            <div className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <time dateTime={safePage.published_at}>Last updated {formatDate(safePage.updated_at || safePage.published_at)}</time>
                            </div>

                            {/* Author */}
                            {safePage.author && (
                                <div className="flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    <span>By {safePage.author.name}</span>
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
                                <span>{Math.ceil((safePage.content || '').split(' ').length / 200)} min read</span>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {safePage.featured_image && (
                        <div className="mb-8">
                            <img src={safePage.featured_image} alt={safePage.title} className="h-auto w-full rounded-lg shadow-lg" />
                        </div>
                    )}

                    {/* Page Content */}
                    <div className="prose prose-lg mb-12 max-w-none" dangerouslySetInnerHTML={{ __html: safePage.content || '' }} />

                    {/* Page Footer */}
                    <footer className="border-t border-gray-200 pt-8">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">Page ID: {safePage.id}</div>
                            <div className="text-sm text-gray-500">Last updated: {formatDate(safePage.updated_at || safePage.published_at)}</div>
                        </div>
                    </footer>
                </article>
            </div>
        </Layout>
    );
}
