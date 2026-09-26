import Layout from './Layout';
import { formatDate, useThemeT } from './partials/ui';

interface Page {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    /** Smaller WebP copies ("url 768w, …") when the image is from the media library */
    featured_image_srcset?: string | null;
    featured_image_alt?: string | null;
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
    const tt = useThemeT();
    const safePage = page || { title: 'Untitled', content: '', published_at: '', updated_at: '' };
    const updated = formatDate(safePage.updated_at || safePage.published_at, { dateStyle: 'long' });

    return (
        <Layout
            title={safePage.meta_title || safePage.title}
            description={safePage.meta_description || safePage.excerpt}
            ogImage={safePage.featured_image}
            site={site}
            theme={theme}
            menus={menus}
        >
            <article className="mx-auto max-w-3xl">
                <header className="mb-10 border-b pb-8">
                    <h1 className="text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{safePage.title}</h1>
                    {safePage.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{safePage.excerpt}</p>}
                    {updated && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            <time dateTime={safePage.updated_at || safePage.published_at}>
                                {tt('page.last_updated', 'Last updated :date', { date: updated })}
                            </time>
                        </p>
                    )}
                </header>

                {safePage.featured_image && (
                    <figure className="mb-10 overflow-hidden rounded-xl border bg-muted">
                        <img
                            src={safePage.featured_image}
                            srcSet={safePage.featured_image_srcset ?? undefined}
                            sizes="(min-width: 800px) 768px, 100vw"
                            alt={safePage.featured_image_alt ?? safePage.title}
                            fetchPriority="high"
                            decoding="async"
                            className="h-auto w-full"
                        />
                    </figure>
                )}

                <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: safePage.content || '' }} />
            </article>
        </Layout>
    );
}
