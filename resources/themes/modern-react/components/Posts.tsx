import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from './Layout';
import PostCard from './partials/PostCard';

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

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  prev_page_url?: string;
  next_page_url?: string;
}

interface PostsProps {
  posts: {
    data: Post[];
  };
  pagination: PaginationData;
  theme: {
    name: string;
    slug: string;
    version: string;
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
  site: {
    name: string;
    tagline?: string;
    logo?: string;
  };
  menus?: any;
}

const Posts: React.FC<PostsProps> = ({ posts, pagination, theme, site, menus }) => {
  // Provide default values to prevent undefined errors
  const safePosts = posts || { data: [] };
  const safePagination = pagination || { current_page: 1, last_page: 1, per_page: 12, total: 0 };
  const safeTheme = theme || { name: 'Modern React', slug: 'modern-react', version: '1.0.0' };
  const safeSite = site || { name: 'Modulo CMS', tagline: 'Modern Content Management System' };
  const safeMenus = menus || {};

  // Filter posts to only include those with post_type.slug === 'post'
  const filteredPosts = {
    ...safePosts,
    data: safePosts.data.filter(post => post?.post_type?.slug === 'post')
  };

  return (
    <Layout theme={safeTheme} site={safeSite} menus={safeMenus}>
      <Head>
        <title>Blog Posts - {safeSite.name}</title>
        <meta name="description" content={`Browse blog posts on ${safeSite.name}`} />
      </Head>

      <div className="space-y-8">
        <header className="text-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog Posts</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Browse all our latest blog posts and articles
          </p>
        </header>

        {filteredPosts?.data && filteredPosts.data.length > 0 ? (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.data.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </section>

            {/* Pagination */}
            {safePagination?.last_page > 1 && (
              <nav className="flex justify-center items-center space-x-4 py-8">
                {safePagination.prev_page_url && (
                  <a
                    href={safePagination.prev_page_url}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    ← Previous
                  </a>
                )}

                <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  Page {safePagination.current_page} of {safePagination.last_page}
                </span>

                {safePagination.next_page_url && (
                  <a
                    href={safePagination.next_page_url}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Next →
                  </a>
                )}
              </nav>
            )}

            <div className="text-center text-gray-600 dark:text-gray-400">
              Showing {filteredPosts?.data?.length || 0} of {safePagination?.total || 0} posts
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No posts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no published posts available at the moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Posts;
