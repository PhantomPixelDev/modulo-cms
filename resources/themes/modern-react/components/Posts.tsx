import SEOHead from '@/components/SEOHead';
import Layout from './Layout';
import LoadingSkeleton from './util/LoadingSkeleton';

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featured_image?: string;
    published_at: string;
    updated_at: string;
    meta_title?: string;
    meta_description?: string;
    author: {
        id: number;
        name: string;
        email: string;
    };
    post_type: {
        id: number;
        name: string;
        label: string;
        slug: string;
        route_prefix: string;
    };
    terms: Array<{
        id: number;
        name: string;
        slug: string;
        taxonomy: {
            name: string;
            label: string;
        };
    }>;
}

interface PostsProps {
    posts?: {
        data: Post[];
    };
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        prev_page_url?: string;
        next_page_url?: string;
    };
    postType?: {
        id: number;
        name: string;
        label: string;
        plural_label: string;
        description?: string;
        slug: string;
        route_prefix: string;
    };
    site?: any;
    theme?: any;
    menus?: any;
    loading?: boolean;
    basePath?: string;
    pageTitle?: string;
    showFilters?: boolean;
}

export default function Posts({ posts, postType, site, theme, menus, loading = false, pagination, basePath, pageTitle, showFilters }: PostsProps) {
    const safeTheme = theme && typeof theme === 'object' ? theme : {};
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const safeMenus = menus && typeof menus === 'object' ? menus : {};

    const allPosts: any[] = Array.isArray((posts as any)?.data) ? (posts as any).data : [];

    // Display all posts passed from the controller (filtering is handled server-side)
    const list = allPosts;

    // Dynamic header content based on post type
    const dynamicPageTitle = postType?.plural_label || 'Blog Posts';
    const dynamicPageDescription = postType?.description || 'Browse all our latest blog posts and articles';
    const resolvedTitle = dynamicPageTitle;
    const resolvedDescription = dynamicPageDescription;

    return (
        <Layout theme={safeTheme} site={safeSite} menus={safeMenus} title={resolvedTitle} description={resolvedDescription}>
            <SEOHead title={`${resolvedTitle} | ${safeSite.name}`} description={resolvedDescription} />
            <div className="space-y-8">
                <header className="rounded-lg bg-indigo-700 py-12 text-center text-white">
                    <h1 className="mb-4 text-4xl font-bold md:text-5xl">{dynamicPageTitle}</h1>
                    <p className="mx-auto max-w-2xl text-xl opacity-90">{dynamicPageDescription}</p>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, i) => (
                            <article key={i} className="rounded-lg bg-white p-6 shadow-lg">
                                <LoadingSkeleton lines={3} className="mb-4" />
                                <div className="flex items-center justify-between">
                                    <LoadingSkeleton className="h-4 w-20" />
                                    <LoadingSkeleton className="h-4 w-16" />
                                </div>
                            </article>
                        ))}
                    </div>
                ) : list.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-gray-600">No posts found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {list.map((p) => {
                            if (!p || typeof p !== 'object' || !p.id) return null;
                            const slug = p.slug || '';
                            const prefix = p.post_type?.route_prefix || 'posts';
                            const href = `/${prefix}/${slug}`;
                            return (
                                <article key={p.id} className="rounded-lg bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
                                    <h2 className="mb-3 text-xl font-bold">
                                        <a href={href} className="text-blue-600 hover:underline">
                                            {p.title || '(untitled)'}
                                        </a>
                                    </h2>
                                    {p.excerpt && <p className="mb-4 line-clamp-3 text-sm text-gray-600">{p.excerpt}</p>}
                                    {p.published_at && <p className="text-xs text-gray-500">{new Date(p.published_at).toLocaleDateString()}</p>}
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pagination && !loading && (
                    <div className="mt-8 flex justify-center">
                        {pagination.prev_page_url && (
                            <a href={pagination.prev_page_url} className="mr-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                Previous
                            </a>
                        )}
                        <span className="px-4 py-2 text-gray-600">
                            Page {pagination.current_page} of {pagination.last_page}
                        </span>
                        {pagination.next_page_url && (
                            <a href={pagination.next_page_url} className="ml-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                Next
                            </a>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
}
