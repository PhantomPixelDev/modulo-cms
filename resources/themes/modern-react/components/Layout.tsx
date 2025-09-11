import React from 'react';
import { Head } from '@inertiajs/react';
import Header from './Header';
import Footer from './Footer';
import Navigation from './partials/Navigation';
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
  const containerWidth = theme?.layout?.container_width || 'max-w-6xl';
  const primaryColor = theme?.colors?.primary || '#3b82f6';
  const fontFamily = theme?.typography?.font_family || 'inter';

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
          }
        `}</style>
      </Head>

      <div className="min-h-screen flex flex-col bg-white text-gray-900">
        <Navigation site={site} menus={menus} />
        
        <main className="flex-1 pt-16">
          <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${containerWidth} py-8`}>
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-3/4">
                {children}
              </div>
              <aside className="lg:w-1/4">
                <Sidebar widgets={widgets} />
              </aside>
            </div>
          </div>
        </main>
        
        <Footer 
          site={site}
          menu={menus?.footer}
          theme={theme}
        />
      </div>
    </>
  );
}
