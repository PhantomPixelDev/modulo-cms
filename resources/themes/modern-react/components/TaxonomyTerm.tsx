import { Tag } from 'lucide-react';
import Layout from './Layout';
import PostCard from './partials/PostCard';
import { EmptyState, PageHeader, Pagination, useThemeT } from './partials/ui';

interface TaxonomyTermProps {
    term: {
        id: number;
        name: string;
        slug: string;
        description?: string;
        taxonomy: {
            id: number;
            name: string;
            slug: string;
            label: string;
        };
    };
    posts: Array<{
        id: number;
        title: string;
        slug: string;
        excerpt: string;
        published_at: string;
        featured_image?: string;
        author: {
            id: number;
            name: string;
        };
        post_type: {
            id: number;
            name: string;
            label: string;
            slug: string;
            route_prefix?: string;
        };
        terms: Array<{
            name: string;
            slug: string;
        }>;
    }>;
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        prev_page_url?: string;
        next_page_url?: string;
    };
    [key: string]: any; // For other shared props
}

export default function TaxonomyTerm(props: TaxonomyTermProps) {
    const { term, posts = [], pagination } = props;
    const tt = useThemeT();
    const total = pagination?.total ?? posts.length;

    return (
        <Layout
            theme={props.theme}
            site={props.site}
            menus={props.menus}
            title={`${term.name} - ${term.taxonomy.label}`}
            description={term.description || tt('taxonomy.browse', 'Browse posts in :name', { name: term.name })}
            sidebar
        >
            <PageHeader
                eyebrow={term.taxonomy.label}
                title={term.name}
                description={
                    <>
                        {term.description && <span className="block">{term.description}</span>}
                        <span className="mt-1 block text-sm">
                            {total === 1 ? tt('taxonomy.count_one', '1 post') : tt('taxonomy.count_other', ':count posts', { count: total })}
                        </span>
                    </>
                }
            />

            {posts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={Tag}
                    title={tt('taxonomy.empty_title', 'No posts in “:name” yet', { name: term.name })}
                    description={tt('taxonomy.empty_description', 'There are no published posts here at the moment.')}
                />
            )}

            <Pagination pagination={pagination} />
        </Layout>
    );
}
