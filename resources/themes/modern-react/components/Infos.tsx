import { Link } from '@inertiajs/react';
import { ArrowRight, Megaphone } from 'lucide-react';
import Layout from './Layout';
import { Badge, EmptyState, formatDate, PageHeader, Pagination, useThemeT } from './partials/ui';

interface InfoItem {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    featured_image?: string;
    published_at: string;
    updated_at: string;
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

interface InfosProps {
    posts: {
        data: InfoItem[];
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
}

export default function Infos({ posts, postType, pagination, site, theme, menus }: InfosProps) {
    const tt = useThemeT();
    const infoItems = (Array.isArray(posts?.data) ? posts.data : []).filter((item) => item && typeof item === 'object' && item.id);
    const prefix = postType?.route_prefix || 'infos';

    const title = postType?.plural_label || tt('info.title', 'Information & Announcements');
    const description = postType?.description || tt('info.description', 'Stay updated with our latest news and announcements.');

    return (
        <Layout theme={theme} site={site} menus={menus} title={title} description={description} sidebar>
            <PageHeader title={title} description={description} />

            {infoItems.length === 0 ? (
                <EmptyState icon={Megaphone} title={tt('info.empty', 'No information items found.')} />
            ) : (
                <ul className="divide-y rounded-xl border bg-card shadow-xs">
                    {infoItems.map((item) => (
                        <li key={item.id} className="group relative p-5 transition-colors hover:bg-accent/40 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {item.published_at && (
                                    <time dateTime={item.published_at}>{formatDate(item.published_at, { dateStyle: 'long' })}</time>
                                )}
                                {item.terms?.slice(0, 3).map((term) => (
                                    <Badge key={term.id}>{term.name}</Badge>
                                ))}
                            </div>
                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                                <Link href={`/${item.post_type?.route_prefix || prefix}/${item.slug}`} className="after:absolute after:inset-0">
                                    {item.title}
                                </Link>
                            </h2>
                            {item.excerpt && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>}
                            <ArrowRight className="absolute top-1/2 right-5 hidden size-4 -translate-y-1/2 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" />
                        </li>
                    ))}
                </ul>
            )}

            <Pagination pagination={pagination} />
        </Layout>
    );
}
