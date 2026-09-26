import { FileText } from 'lucide-react';
import Layout from './Layout';
import PostCard from './partials/PostCard';
import { EmptyState, PageHeader, Pagination, useThemeT } from './partials/ui';
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

export default function Posts({ posts, postType, site, theme, menus, loading = false, pagination }: PostsProps) {
    const tt = useThemeT();
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
    const list = (Array.isArray(posts?.data) ? posts.data : []).filter((p) => p && typeof p === 'object' && p.id);

    const title = postType?.plural_label || tt('posts.title', 'Blog Posts');
    const description = postType?.description || tt('posts.description', 'Browse all our latest posts and articles.');

    return (
        <Layout theme={theme} site={safeSite} menus={menus} title={title} description={description} sidebar>
            <PageHeader title={title} description={description} />

            {loading ? (
                <div className="grid gap-6 sm:grid-cols-2">
                    {Array.from({ length: 4 }, (_, i) => (
                        <div key={i} className="rounded-xl border bg-card p-5">
                            <LoadingSkeleton lines={3} />
                        </div>
                    ))}
                </div>
            ) : list.length === 0 ? (
                <EmptyState icon={FileText} title={tt('posts.empty', 'No posts found.')} />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {list.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}

            {!loading && <Pagination pagination={pagination} />}
        </Layout>
    );
}
