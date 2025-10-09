import React from 'react';
import Layout from './Layout';
import SEOHead from '@/components/SEOHead';
import PostCard from './partials/PostCard';

interface ArchiveProps {
  title: string;
  posts: any[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
  };
  site: { name: string };
  theme?: Record<string, any>;
  menus?: Record<string, any>;
  keywords?: string;
}

const Archive: React.FC<ArchiveProps> = ({ title, posts, pagination, site, theme, menus, keywords }) => {
  const archiveTitle = `${title} - ${site.name}`;
  const archiveDescription = `Browse ${title} on ${site.name}`;
  const archiveKeywords = typeof keywords === 'string' && keywords.length > 0
    ? keywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [];

  return (
    <Layout
      title={archiveTitle}
      description={archiveDescription}
      site={site}
      theme={theme}
      menus={menus}
      keywords={archiveKeywords.join(', ')}
    >
      <SEOHead title={archiveTitle} description={archiveDescription} />
      <section className="py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            {pagination.current_page > 1 && (
              <a
                href={`?page=${pagination.current_page - 1}`}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Previous
              </a>
            )}

            <span className="px-4 py-2">
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            {pagination.current_page < pagination.last_page && (
              <a
                href={`?page=${pagination.current_page + 1}`}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Next
              </a>
            )}
          </nav>
        </div>
      </section>
    </Layout>
  );
};

export default Archive;
