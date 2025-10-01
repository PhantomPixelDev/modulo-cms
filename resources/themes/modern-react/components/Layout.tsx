import React from 'react';
import { Head } from '@inertiajs/react';
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
  site?: {
    name?: string;
    tagline?: string;
    logo?: string;
    description?: string;
    social_links?: {
      [key: string]: string;
    };
  };
  menus?: {
    header?: Array<{
      id: number;
      label: string;
      url: string;
      target: string;
      children?: Array<any>;
    }>;
    footer?: Array<any>;
  };
  widgets?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    settings: Record<string, any>;
  }>;
}

const normalizeMenuItems = (menuData: any): Array<Record<string, any>> => {
  if (!menuData) {
    return [];
  }

  if (Array.isArray(menuData)) {
    return menuData.filter((item) => item && typeof item === 'object');
  }

  if (typeof menuData === 'object') {
    if (Array.isArray(menuData.items)) {
      return menuData.items.filter((item) => item && typeof item === 'object');
    }

    if (menuData.items && typeof menuData.items === 'object') {
      return Object.values(menuData.items).filter((item) => item && typeof item === 'object');
    }

    if (Array.isArray(menuData.data)) {
      return menuData.data.filter((item) => item && typeof item === 'object');
    }
  }

  return [];
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
  widgets = []
}: LayoutProps) {
  const pageTitle = title ? `${title} | ${site?.name || 'Modulo CMS'}` : site?.name || 'Modulo CMS';
  const containerWidth = theme?.layout?.container_width || 'container';
  const primaryColor = theme?.colors?.primary || '#3b82f6';
  const fontFamily = theme?.typography?.font_family || 'inter';
  const footerMenuItems = normalizeMenuItems(menus?.footer);

  if (typeof window !== 'undefined') {
    console.groupCollapsed('[Layout] Render props snapshot');
    console.log('site', site);
    console.log('theme', theme);
    console.log('menus', menus);
    console.log('normalized footer menu', footerMenuItems);
    console.groupEnd();
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        {description && <meta property="og:description" content={description} />}
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        {description && <meta name="twitter:description" content={description} />}
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        
        {/* Theme Styles */}
        <style>{`
          :root {
            --color-primary: ${primaryColor};
            --color-secondary: ${theme?.colors?.secondary || '#64748b'};
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
        {/* Re-enabled Navigation */}
        <ErrorBoundary name="Navigation">
          <Navigation site={site} menus={menus} />
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
        {/* Footer */}
        <ErrorBoundary name="Footer">
          <Footer 
            site={site} 
            // Pass only actual menu items to Footer to avoid runtime errors
            menu={footerMenuItems}
            theme={theme}
          />
        </ErrorBoundary>
      </div>
    </>
  );
}
