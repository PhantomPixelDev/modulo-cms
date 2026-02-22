import React from 'react';
import Layout from './Layout';
import { Link } from '@inertiajs/react';

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
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeMenus = menus && typeof menus === 'object' ? menus : {};
  const themeColors = safeTheme.colors || {};
  const primary = themeColors.primary || '#3b82f6';
  const accent = themeColors.accent || primary;
  const cardBg = themeColors.card || '#ffffff';
  const background = themeColors.background || '#f8fafc';
  const textPrimary = themeColors.text_primary || '#0f172a';
  const textMuted = themeColors.text_muted || '#475569';
  const borderColor = themeColors.border || '#e2e8f0';
  const buttonText = themeColors.button_text || '#ffffff';

  return (
    <Layout 
      theme={safeTheme} 
      site={safeSite} 
      menus={safeMenus}
      title={post.title}
      description={post.excerpt}
    >
      <div className="py-10" style={{ backgroundColor: background }}>
        <article
          className="prose prose-lg max-w-none"
          style={{
            color: textMuted,
            ['--tw-prose-body' as any]: textMuted,
            ['--tw-prose-headings' as any]: textPrimary,
            ['--tw-prose-bold' as any]: textPrimary,
            ['--tw-prose-links' as any]: primary
          }}
        >
          {/* Header */}
          <header className="mb-8 pb-8" style={{ borderBottom: `1px solid ${borderColor}` }}>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="px-3 py-1 text-sm font-semibold rounded-full"
                style={{ backgroundColor: `${accent}15`, color: accent }}
              >
                Information
              </span>
              {post.published_at && (
                <span className="text-sm" style={{ color: textMuted }}>
                  {new Date(post.published_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: textPrimary }}>
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="text-xl leading-relaxed" style={{ color: textMuted }}>
                {post.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-4 mt-6 text-sm" style={{ color: textMuted }}>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{post.author.name}</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div
              className="mb-8 rounded-2xl overflow-hidden shadow-lg"
              style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
            >
              <img
                src={post.featured_image}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="prose-headings:font-bold prose-a:no-underline hover:prose-a:underline"
            style={{
              ['--tw-prose-links' as any]: primary,
              ['--tw-prose-invert-links' as any]: primary
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags/Terms */}
          {post.terms && post.terms.length > 0 && (
            <div className="mt-8 pt-8" style={{ borderTop: `1px solid ${borderColor}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {post.terms.map((term) => (
                  <Link
                    key={term.id}
                    href={`/${term.taxonomy.name}/${term.slug}`}
                    className="px-3 py-1 text-sm rounded-full transition-colors"
                    style={{ backgroundColor: `${borderColor}40`, color: textPrimary }}
                  >
                    {term.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back Link */}
          <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${borderColor}` }}>
            <Link
              href="/infos"
              className="inline-flex items-center font-medium"
              style={{ color: primary }}
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to all information
            </Link>
          </div>
        </article>
      </div>
    </Layout>
  );
}
