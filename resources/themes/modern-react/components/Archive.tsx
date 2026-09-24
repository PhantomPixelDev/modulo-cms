import SEOHead from '@/components/SEOHead';
import { FileText } from 'lucide-react';
import React from 'react';
import Layout from './Layout';
import PostCard from './partials/PostCard';
import { EmptyState, PageHeader, Pagination, useThemeT } from './partials/ui';

interface ArchiveProps {
    title: string;
    posts: any[];
    pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
    };
    site: { name: string };
    theme?: Record<string, any>;
    menus?: Record<string, any>;
    keywords?: string;
}

const Archive: React.FC<ArchiveProps> = ({ title, posts = [], pagination, site, theme, menus, keywords }) => {
    const tt = useThemeT();
    const archiveTitle = `${title} - ${site.name}`;
    const archiveDescription = `Browse ${title} on ${site.name}`;
    const archiveKeywords =
        typeof keywords === 'string' && keywords.length > 0
            ? keywords
                  .split(',')
                  .map((k) => k.trim())
                  .filter(Boolean)
            : [];

    return (
        <Layout
            title={archiveTitle}
            description={archiveDescription}
            site={site}
            theme={theme}
            menus={menus}
            keywords={archiveKeywords.join(', ')}
            sidebar
        >
            <SEOHead title={archiveTitle} description={archiveDescription} />
            <PageHeader title={title} />
            {posts.length === 0 ? (
                <EmptyState icon={FileText} title={tt('posts.empty', 'No posts found.')} />
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
            <Pagination pagination={pagination} />
        </Layout>
    );
};

export default Archive;
