import React from 'react';
import Layout from './Layout';
import { Link } from '@inertiajs/react';

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
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeMenus = menus && typeof menus === 'object' ? menus : {};
  const themeColors = safeTheme.colors || {};
  const primary = themeColors.primary || '#3b82f6';
  const gradientFrom = themeColors.gradient_from || primary;
  const gradientTo = themeColors.gradient_to || primary;
  const cardBg = themeColors.card || '#ffffff';
  const background = themeColors.background || '#f8fafc';
  const textPrimary = themeColors.text_primary || '#0f172a';
  const textMuted = themeColors.text_muted || '#475569';
  const borderColor = themeColors.border || '#e2e8f0';
  const buttonText = themeColors.button_text || '#ffffff';

  const infoItems: InfoItem[] = Array.isArray((posts as any)?.data) ? (posts as any).data : [];

  // Dynamic header content based on post type
  const pageTitle = postType?.plural_label || 'Information & Announcements';
  const pageDescription = postType?.description || 'Stay updated with our latest news and announcements';

  return (
    <Layout theme={safeTheme} site={safeSite} menus={safeMenus}>
      <div className="space-y-8" style={{ backgroundColor: background }}>
        <header
          className="text-center py-12 rounded-3xl shadow-xl"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
            color: buttonText,
            boxShadow: `0 25px 50px ${gradientFrom}33`
          }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{pageTitle}</h1>
          <p className="text-xl max-w-2xl mx-auto" style={{ opacity: 0.85 }}>
            {pageDescription}
          </p>
        </header>

        {infoItems.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ color: textMuted }}>No information items found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {infoItems.map((item) => {
              if (!item || typeof item !== 'object' || !item.id) return null;
              const href = `/infos/${item.slug}`;
              
              return (
                <article
                  key={item.id}
                  className="rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-shadow border-l-4"
                  style={{ backgroundColor: cardBg, borderColor: primary, color: textPrimary, borderLeftColor: primary }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>
                        <Link href={href} className="transition-colors" style={{ color: textPrimary }}>
                          {item.title}
                        </Link>
                      </h2>
                      {item.published_at && (
                        <p className="text-sm" style={{ color: textMuted }}>
                          {new Date(item.published_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                    </div>
                    <span
                      className="px-3 py-1 text-sm font-semibold rounded-full"
                      style={{ backgroundColor: `${primary}22`, color: primary }}
                    >
                      Info
                    </span>
                  </div>
                  
                  {item.excerpt && (
                    <p className="mb-4 leading-relaxed" style={{ color: textMuted }}>{item.excerpt}</p>
                  )}
                  
                  {item.terms && item.terms.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.terms.map((term) => (
                        <span
                          key={term.id}
                          className="px-2 py-1 text-xs rounded"
                          style={{ backgroundColor: `${borderColor}55`, color: textMuted }}
                        >
                          {term.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Link
                    href={href}
                    className="inline-flex items-center font-medium"
                    style={{ color: primary }}
                  >
                    Read more
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {pagination && pagination.last_page > 1 && (
          <nav className="flex justify-center items-center space-x-4 py-8" style={{ color: textPrimary }}>
            {pagination.prev_page_url && (
              <a
                href={pagination.prev_page_url}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textPrimary }}
              >
                ← Previous
              </a>
            )}

            <span className="px-4 py-2" style={{ color: textMuted }}>
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            {pagination.next_page_url && (
              <a
                href={pagination.next_page_url}
                className="px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textPrimary }}
              >
                Next →
              </a>
            )}
          </nav>
        )}
      </div>
    </Layout>
  );
}
