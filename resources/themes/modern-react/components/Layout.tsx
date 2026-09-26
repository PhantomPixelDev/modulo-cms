import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import React from 'react';
import '../assets/css/theme.css';
import Footer from './Footer';
import Navigation from './partials/Navigation';
import Sidebar from './partials/Sidebar';
import { Container, normalizeMenuItems } from './partials/ui';
import ErrorBoundary from './util/ErrorBoundary';

interface LayoutProps {
    children: React.ReactNode;
    /** Show the search / categories / tags column (listings and single posts). */
    sidebar?: boolean;
    /** Drop the default page padding, e.g. for a full-bleed home hero. */
    bare?: boolean;
    title?: string;
    description?: string;
    keywords?: string;
    ogImage?: string;
    canonicalUrl?: string;
    /** Keep the page out of search engines (cart, checkout, account pages). */
    noindex?: boolean;
    theme?: {
        /** Stylesheets from theme.json "styles" (child themes restyle this one with these). */
        styles?: string[];
        colors?: {
            primary?: string;
            secondary?: string;
        };
        typography?: {
            font_family?: string;
        };
        layout?: {
            container_width?: string;
        };
    };
    site?: any;
    menus?: any;
    widgets?: Array<{
        id: string;
        title: string;
        content: string;
        type: string;
        settings?: Record<string, any>;
    }>;
    post?: {
        id?: number;
        title?: string;
        excerpt?: string;
        featured_image?: string;
        published_at?: string;
        author?: {
            name?: string;
        };
        post_type?: {
            name?: string;
        };
        /** From the post's SEO tab: search and social previews. */
        seo?: {
            title?: string;
            description?: string;
            image?: string | null;
            canonical?: string | null;
            noindex?: boolean;
        };
    };
    page?: {
        id?: number;
        title?: string;
        excerpt?: string;
        featured_image?: string;
        updated_at?: string;
        author?: {
            name?: string;
        };
    };
}

const FONT_STACKS: Record<string, string> = {
    roboto: 'Roboto, system-ui, sans-serif',
    'open-sans': '"Open Sans", system-ui, sans-serif',
};

export default function Layout({
    children,
    sidebar = false,
    bare = false,
    title,
    description,
    keywords,
    ogImage,
    canonicalUrl,
    theme: themeProp,
    site,
    menus,
    widgets = [],
    post,
    page,
    noindex = false,
}: LayoutProps) {
    const { auth, theme: pageTheme } = usePage().props as any;
    // Some templates do not pass the theme down; the page props always carry it.
    const theme: LayoutProps['theme'] = themeProp ?? pageTheme;
    // Safe defaults with proper null checks - use more defensive approach
    const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS', tagline: '' };
    const safeMenus = menus && typeof menus === 'object' ? menus : { header: [], footer: [] };
    const safeAuth = auth && typeof auth === 'object' ? auth : { user: null };
    const seo = post?.seo;
    const pageTitle = (seo?.title ?? title) ? `${seo?.title ?? title} | ${safeSite.name}` : safeSite.name;

    // Only override the design tokens when the theme actually configures them.
    const customPrimary = theme?.colors?.primary;
    const customFont = FONT_STACKS[theme?.typography?.font_family ?? ''];
    const themeOverrides = [customPrimary && `--primary: ${customPrimary}; --ring: ${customPrimary};`, customFont && `font-family: ${customFont};`]
        .filter(Boolean)
        .join(' ');

    useDocumentTitle(pageTitle);

    // Enhanced SEO data based on content type
    const isArticle = post && post.id;
    const isPage = page && page.id;
    const contentAuthor = post?.author?.name || page?.author?.name || safeSite.name;
    const contentImage = seo?.image || post?.featured_image || page?.featured_image || ogImage;
    const canonicalUrlValue = seo?.canonical || canonicalUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '');
    const contentDescription = seo?.description || post?.excerpt || page?.excerpt || description || safeSite.description;
    const contentPublishedDate = post?.published_at || page?.updated_at;

    const footerMenuItems = normalizeMenuItems(safeMenus.footer);

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                {(theme?.styles ?? []).map((href) => (
                    <link key={href} rel="stylesheet" href={href} />
                ))}
                {contentDescription && <meta name="description" content={contentDescription} />}
                {keywords && <meta name="keywords" content={keywords} />}
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="author" content={contentAuthor} />

                {/* Enhanced Open Graph tags */}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={contentDescription} />
                {contentImage && <meta property="og:image" content={contentImage} />}
                <meta property="og:url" content={canonicalUrlValue} />
                <meta property="og:site_name" content={safeSite.name} />
                <meta property="og:type" content={isArticle ? 'article' : 'website'} />
                {isArticle && contentPublishedDate && <meta property="article:published_time" content={contentPublishedDate} />}
                {isArticle && post?.author?.name && <meta property="article:author" content={post.author.name} />}

                {/* Enhanced Twitter Card tags */}
                <meta name="twitter:card" content={contentImage ? 'summary_large_image' : 'summary'} />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={contentDescription} />
                {contentImage && <meta name="twitter:image" content={contentImage} />}
                <meta name="twitter:site" content={safeSite.name} />

                {/* Additional SEO meta tags */}
                <meta
                    name="robots"
                    content={
                        seo?.noindex || noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
                    }
                />
                <meta name="language" content="en-US" />
                {canonicalUrlValue && <link rel="canonical" href={canonicalUrlValue} />}

                {/* Structured Data (JSON-LD) */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': isArticle ? 'Article' : 'WebPage',
                        headline: pageTitle,
                        description: contentDescription,
                        author: {
                            '@type': 'Person',
                            name: contentAuthor,
                        },
                        publisher: {
                            '@type': 'Organization',
                            name: safeSite.name,
                            logo: {
                                '@type': 'ImageObject',
                                url: safeSite.logo || contentImage,
                            },
                        },
                        datePublished: contentPublishedDate,
                        dateModified: contentPublishedDate,
                        image: contentImage,
                        url: canonicalUrlValue,
                        mainEntityOfPage: {
                            '@type': 'WebPage',
                            '@id': canonicalUrlValue,
                        },
                    })}
                </script>

                {themeOverrides && <style>{`:root { ${themeOverrides} }`}</style>}
            </Head>

            <div className="flex min-h-screen flex-col bg-background text-foreground">
                {/* First thing a keyboard or screen reader user reaches: past the navigation */}
                <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
                >
                    Skip to content
                </a>
                <ErrorBoundary name="Navigation">
                    <Navigation site={safeSite} menus={safeMenus} auth={safeAuth} />
                </ErrorBoundary>
                <main id="main" tabIndex={-1} className={cn('flex-1', !bare && 'py-10 sm:py-14')}>
                    {bare ? (
                        <ErrorBoundary name="PageContent">{children}</ErrorBoundary>
                    ) : (
                        <Container className={cn(sidebar && 'grid gap-12 lg:grid-cols-[minmax(0,1fr)_18rem]')}>
                            <div className="min-w-0">
                                <ErrorBoundary name="PageContent">{children}</ErrorBoundary>
                            </div>
                            {sidebar && (
                                <aside className="lg:sticky lg:top-24 lg:self-start">
                                    <ErrorBoundary name="Sidebar">
                                        <Sidebar />
                                    </ErrorBoundary>
                                </aside>
                            )}
                        </Container>
                    )}
                </main>
                <ErrorBoundary name="Footer">
                    <Footer site={safeSite} menu={footerMenuItems} />
                </ErrorBoundary>
            </div>
        </>
    );
}
