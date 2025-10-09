import React from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import ErrorBoundary from './util/ErrorBoundary';
import Navigation from './partials/Navigation';
import Footer from './Footer';
import Sidebar from './partials/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  theme?: {
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
  };
  page?: {
    id?: number;
    title?: string;
    excerpt?: string;
    updated_at?: string;
    author?: {
      name?: string;
    };
  };
}

const normalizeMenuItems = (menuData: any): Array<Record<string, any>> => {
  try {
    if (!menuData) return [];
    if (Array.isArray(menuData)) {
      return menuData.filter((item: any) => item && typeof item === 'object') as Array<Record<string, any>>;
    }

    if (typeof menuData === 'object' && menuData !== null) {
      if (Array.isArray((menuData as any).items)) {
        return (menuData as any).items.filter((item: any) => item && typeof item === 'object') as Array<Record<string, any>>;
      }

      if (Array.isArray((menuData as any).data)) {
        return (menuData as any).data.filter((item: any) => item && typeof item === 'object') as Array<Record<string, any>>;
      }
    }

    return [];
  } catch (error) {
    console.error('normalizeMenuItems error:', error, menuData);
    return [];
  }
};

export default function Layout({ 
  children, 
  title, 
  description, 
  keywords, 
  ogImage, 
  canonicalUrl,
  theme,
  site,
  menus,
  widgets = [],
  post,
  page
}: LayoutProps) {
  const { auth } = usePage().props as any;
  // Safe defaults with proper null checks - use more defensive approach
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS', tagline: '' };
  const safeTheme = theme && typeof theme === 'object' ? theme : { colors: { primary: '#3b82f6', secondary: '#64748b' }, typography: { font_family: 'inter' }, layout: { container_width: 'container' } };
  const safeMenus = menus && typeof menus === 'object' ? menus : { header: [], footer: [] };
  const safeAuth = auth && typeof auth === 'object' ? auth : { user: null };
  const pageTitle = title ? `${title} | ${safeSite.name}` : safeSite.name;
  const containerWidth = safeTheme.layout?.container_width || 'container';
  const primaryColor = safeTheme.colors?.primary || '#3b82f6';
  const fontFamily = safeTheme.typography?.font_family || 'inter';
  
  // Enhanced SEO data based on content type
  const isArticle = post && post.id;
  const isPage = page && page.id;
  const contentAuthor = post?.author?.name || page?.author?.name || safeSite.name;
  const contentImage = post?.featured_image || page?.featured_image || ogImage;
  const canonicalUrlValue = (typeof window !== 'undefined' ? window.location.href : '');
  const contentDescription = post?.excerpt || page?.excerpt || description || safeSite.description;
  const contentPublishedDate = post?.published_at || page?.updated_at;
  
  let footerMenuItems: Array<Record<string, any>> = [];
  try {
    const footerData = safeMenus && safeMenus.footer ? safeMenus.footer : [];
    footerMenuItems = normalizeMenuItems(footerData);
  } catch (e) {
    console.error('Error normalizing footer menu:', e);
    footerMenuItems = [];
  }

  // Ensure footerMenuItems is always an array
  if (!Array.isArray(footerMenuItems)) {
    footerMenuItems = [];
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
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
        <meta property="og:type" content={isArticle ? "article" : "website"} />
        {isArticle && contentPublishedDate && (
          <meta property="article:published_time" content={contentPublishedDate} />
        )}
        {isArticle && post?.author?.name && (
          <meta property="article:author" content={post.author.name} />
        )}
        
        {/* Enhanced Twitter Card tags */}
        <meta name="twitter:card" content={contentImage ? "summary_large_image" : "summary"} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={contentDescription} />
        {contentImage && <meta name="twitter:image" content={contentImage} />}
        <meta name="twitter:site" content={safeSite.name} />
        
        {/* Additional SEO meta tags */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="language" content="en-US" />
        {canonicalUrlValue && <link rel="canonical" href={canonicalUrlValue} />}
        
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": isArticle ? "Article" : "WebPage",
            "headline": pageTitle,
            "description": contentDescription,
            "author": {
              "@type": "Person",
              "name": contentAuthor
            },
            "publisher": {
              "@type": "Organization",
              "name": safeSite.name,
              "logo": {
                "@type": "ImageObject",
                "url": safeSite.logo || contentImage
              }
            },
            "datePublished": contentPublishedDate,
            "dateModified": contentPublishedDate,
            "image": contentImage,
            "url": canonicalUrlValue,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": canonicalUrlValue
            }
          })}
        </script>
        
        <style>{`
          :root {
            --color-primary: ${primaryColor};
            --color-secondary: ${safeTheme.colors?.secondary || '#64748b'};
          }
          
          body {
            font-family: ${fontFamily === 'inter' ? 'Inter, system-ui, sans-serif' : 
                         fontFamily === 'roboto' ? 'Roboto, system-ui, sans-serif' :
                         fontFamily === 'open-sans' ? '"Open Sans", system-ui, sans-serif' :
                         'system-ui, sans-serif'};
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
            min-height: 100vh;
          }
        `}</style>
      </Head>

      <div className="min-h-screen flex flex-col">
        <ErrorBoundary name="Navigation">
          <Navigation site={safeSite} menus={safeMenus} auth={safeAuth} />
        </ErrorBoundary>
        <main className="flex-1 pt-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col xl:flex-row gap-8">
              <div className="xl:w-4/5">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-gray-900">
                  <ErrorBoundary name="PageContent">
                    {children}
                  </ErrorBoundary>
                </div>
              </div>
              <aside className="xl:w-1/5">
                <ErrorBoundary name="Sidebar">
                  <Sidebar />
                </ErrorBoundary>
              </aside>
            </div>
          </div>
        </main>
        <ErrorBoundary name="Footer">
          <Footer 
            site={safeSite} 
            menu={footerMenuItems}
            theme={safeTheme}
          />
        </ErrorBoundary>
      </div>
    </>
  );
}
