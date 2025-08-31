import React from 'react';
import Layout from './Layout';
import PostCard from './partials/PostCard';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  published_at: string;
  author?: {
    name: string;
    avatar?: string;
  };
  post_type?: {
    name: string;
    label: string;
  };
  terms?: Array<{
    name: string;
    slug: string;
  }>;
}

interface IndexProps {
  posts: {
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
  site?: any;
  theme?: any;
  menus?: any;
}

export default function Index({ posts, pagination, site, theme, menus }: IndexProps) {
  // Provide default values to prevent undefined errors
  const safePosts = posts || { data: [] };
  const safePagination = pagination || { current_page: 1, last_page: 1, per_page: 12, total: 0 };
  const safeTheme = theme || { name: 'Modern React', slug: 'modern-react', version: '1.0.0' };
  const safeSite = site || { name: 'Modulo CMS', tagline: 'Modern Content Management System' };
  const safeMenus = menus || {};

  return (
    <Layout
      title="Home"
      description={safeSite?.tagline || "Welcome to our website"}
      site={safeSite}
      theme={safeTheme}
      menus={safeMenus}
    >
      <div className="py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {safeSite?.name || 'Welcome'}
          </h1>
          {safeSite?.tagline && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {safeSite.tagline}
            </p>
          )}
        </div>

        {/* Posts Grid */}
        {safePosts?.data && safePosts.data.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {safePosts.data.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post}
                  theme={safeTheme}
                />
              ))}
            </div>

            {/* Pagination */}
            {safePagination && safePagination.last_page > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                {safePagination.prev_page_url && (
                  <a
                    href={safePagination.prev_page_url}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    Previous
                  </a>
                )}
                
                <span className="text-sm text-gray-700">
                  Page {safePagination.current_page} of {safePagination.last_page}
                </span>
                
                {safePagination.next_page_url && (
                  <a
                    href={safePagination.next_page_url}
                    className="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200"
                    style={{ backgroundColor: safeTheme?.colors?.primary || '#3b82f6' }}
                  >
                    Next
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${theme?.colors?.primary || '#3b82f6'}20` }}
              >
                <svg className="w-8 h-8" style={{ color: theme?.colors?.primary || '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600">
                Check back later for new content, or explore other sections of the site.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
