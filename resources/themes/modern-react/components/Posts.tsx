import React from 'react';
import Layout from './Layout';
import LoadingSkeleton from './util/LoadingSkeleton';
import SEOHead from '@/components/SEOHead';
import { useTranslation } from '@/hooks/useTranslation';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
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

interface PostsProps {
  posts?: {
    data: Post[];
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
  loading?: boolean;
  basePath?: string;
  pageTitle?: string;
  showFilters?: boolean;
}

export default function Posts({
  posts,
  postType,
  site,
  theme,
  menus,
  loading = false,
  pagination,
  basePath,
  pageTitle,
  showFilters
}: PostsProps) {
  const { t, locale } = useTranslation();
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  const allPosts: any[] = Array.isArray((posts as any)?.data) ? (posts as any).data : [];

  // Display all posts passed from the controller (filtering is handled server-side)
  const list = allPosts;

  // Dynamic header content based on post type
  const dynamicPageTitle = postType?.plural_label || t('theme.posts.title', {}, 'Blog Posts');
  const dynamicPageDescription = postType?.description || t('theme.posts.description', {}, 'Browse all our latest blog posts and articles');
  const resolvedTitle = dynamicPageTitle;
  const resolvedDescription = dynamicPageDescription;

  return (
    <Layout
      theme={safeTheme}
      site={safeSite}
      menus={safeMenus}
      title={resolvedTitle}
      description={resolvedDescription}
    >
      <SEOHead title={`${resolvedTitle} | ${safeSite.name}`} description={resolvedDescription} />
      <div className="space-y-8">
        <header className="text-center py-12 bg-indigo-700 text-white rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{dynamicPageTitle}</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {dynamicPageDescription}
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <article key={i} className="bg-white rounded-lg shadow-lg p-6">
                <LoadingSkeleton lines={3} className="mb-4" />
                <div className="flex justify-between items-center">
                  <LoadingSkeleton className="w-20 h-4" />
                  <LoadingSkeleton className="w-16 h-4" />
                </div>
              </article>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">{t('theme.posts.empty', {}, 'No posts found.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map((p) => {
              if (!p || typeof p !== 'object' || !p.id) return null;
              const slug = p.slug || '';
              const prefix = p.post_type?.route_prefix || 'posts';
              const href = `/${prefix}/${slug}`;
              return (
                <article key={p.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <h2 className="text-xl font-bold mb-3">
                    <a href={href} className="text-blue-600 hover:underline">
                      {p.title || '(untitled)'}
                    </a>
                  </h2>
                  {p.excerpt && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{p.excerpt}</p>
                  )}
                  {p.published_at && (
                    <p className="text-xs text-gray-500">
                      {new Date(p.published_at).toLocaleDateString(locale)}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && !loading && (
          <div className="flex justify-center mt-8">
            {pagination.prev_page_url && (
              <a
                href={pagination.prev_page_url}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
              >
                {t('theme.buttons.previous', {}, 'Previous')}
              </a>
            )}
            <span className="px-4 py-2 text-gray-600">
              {t('theme.posts.pagination', { current: pagination.current_page, total: pagination.last_page }, `Page ${pagination.current_page} of ${pagination.last_page}`)}
            </span>
            {pagination.next_page_url && (
              <a
                href={pagination.next_page_url}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-2"
              >
                {t('theme.buttons.next', {}, 'Next')}
              </a>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
