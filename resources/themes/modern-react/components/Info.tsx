import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Layout from './Layout';
import { Badge, formatDate, useThemeT } from './partials/ui';

interface InfoProps {
    post: {
        id: number;
        title: string;
        slug: string;
        content: string;
        excerpt?: string;
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
        terms?: Array<{
            id: number;
            name: string;
            slug: string;
            taxonomy: {
                name: string;
                label: string;
            };
        }>;
    };
    site?: any;
    theme?: any;
    menus?: any;
}

export default function Info({ post, site, theme, menus }: InfoProps) {
    const tt = useThemeT();
    const listUrl = `/${post.post_type?.route_prefix || 'infos'}`;
    const listLabel = post.post_type?.label || tt('info.label', 'Information');

    return (
        <Layout theme={theme} site={site} menus={menus} title={post.title} description={post.excerpt} post={post} sidebar>
            <article className="mx-auto max-w-3xl">
                <Link
                    href={listUrl}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    {tt('post.back_to', 'Back to :label', { label: listLabel })}
                </Link>

                <header className="mt-6 mb-8 border-b pb-8">
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="primary">{listLabel}</Badge>
                        {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at, { dateStyle: 'long' })}</time>}
                        {post.author?.name && <span>· {post.author.name}</span>}
                    </div>
                    <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl">{post.title}</h1>
                    {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>}
                </header>

                {post.featured_image && (
                    <figure className="mb-10 overflow-hidden rounded-xl border bg-muted">
                        <img src={post.featured_image} alt={post.title} className="h-auto w-full" />
                    </figure>
                )}

                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

                {post.terms && post.terms.length > 0 && (
                    <div className="mt-10 flex flex-wrap items-center gap-2 border-t pt-8">
                        <span className="mr-1 text-sm font-medium text-foreground">{tt('info.topics', 'Topics')}</span>
                        {post.terms.map((term) => (
                            <Link key={term.id} href={`/${term.taxonomy?.name}/${term.slug}`}>
                                <Badge variant="outline" className="transition-colors hover:bg-accent">
                                    {term.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                )}
            </article>
        </Layout>
    );
}
