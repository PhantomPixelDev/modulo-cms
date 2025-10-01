import React from 'react';
import Layout from './Layout';

interface TaxonomyTermProps {
  term: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    taxonomy: {
      id: number;
      name: string;
      slug: string;
      label: string;
    };
  };
  posts: Array<{
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    published_at: string;
    featured_image?: string;
    author: {
      id: number;
      name: string;
    };
    post_type: {
      id: number;
      name: string;
      label: string;
      slug: string;
      route_prefix?: string;
    };
    terms: Array<{
      name: string;
      slug: string;
    }>;
  }>;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string;
    next_page_url?: string;
  };
  [key: string]: any; // For other shared props
}

export default function TaxonomyTerm(props: TaxonomyTermProps) {
  const { term, posts, pagination } = props;
  
  const getPostUrl = (post: any) => {
    const slug = post.slug || 'unknown';
    const prefix = post.post_type?.route_prefix;
    return prefix ? `/${prefix}/${slug}` : `/posts/${slug}`;
  };

  return (
    <Layout 
      theme={props.theme} 
      site={props.site} 
      menus={props.menus}
      title={`${term.name} - ${term.taxonomy.label}`}
      description={term.description || `Browse posts in ${term.name}`}
    >
      <div className="space-y-8">
        
        <header className="text-center py-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg">
          <div className="mb-2">
            <span className="inline-block px-3 py-1 text-sm bg-white/20 rounded-full">
              {term.taxonomy.label}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{term.name}</h1>
          {term.description && (
            <p className="text-xl opacity-90 max-w-2xl mx-auto">{term.description}</p>
          )}
          <p className="text-lg opacity-80 mt-2">
            {pagination.total} {pagination.total === 1 ? 'post' : 'posts'} found
          </p>
        </header>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const url = getPostUrl(post);
              const published = post.published_at ? new Date(post.published_at).toLocaleDateString() : '';
              
              return (
                <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    <a href={url} className="hover:text-blue-600 transition-colors">
                      {post.title}
                    </a>
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>By: {post.author?.name || 'Unknown Author'}</p>
                    <p>Type: {post.post_type?.label || 'Post'}</p>
                    {published && <p>Published: {published}</p>}
                  </div>
                  {post.terms && post.terms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {post.terms.map((termTag, idx) => (
                        <span key={idx} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {termTag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No posts found in "{term.name}"</h3>
              <p className="text-gray-600">There are no published posts in this category at the moment.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
