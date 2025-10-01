import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from './Layout';
import PostCard from './partials/PostCard';

interface SearchProps {
  posts?: {
    data: any[];
  };
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url?: string;
    next_page_url?: string;
  };
  searchQuery?: string;
  [key: string]: any; // For other shared props
}

const Search: React.FC<SearchProps> = ({ posts, pagination, searchQuery, ...props }) => {
  const [query, setQuery] = useState(searchQuery || '');

  // Handle both React data structure (posts.data) and fallback structure (posts as direct array)
  const results = posts?.data || posts || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.get('/search', { q: query.trim() });
    }
  };

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
      title={`Search Results${searchQuery ? ` for "${searchQuery}"` : ''}`}
      description={searchQuery ? `Search results for "${searchQuery}"` : 'Search'}
    >
      <div className="space-y-8">

        <header className="text-center py-12 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Search'}
          </h1>
          <p className="text-lg opacity-80">
            {pagination ? `${pagination.total} ${pagination.total === 1 ? 'result' : 'results'} found` : 'Enter search terms to find content'}
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, pages, and content..."
              className="w-full px-6 py-4 pr-16 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-lg shadow-lg"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">No posts match your search for "{searchQuery}". Try different keywords or check your spelling.</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">Enter keywords above to search through our posts and pages.</p>
            </div>
          </div>
        )}

        {pagination && pagination.last_page > 1 && results.length > 0 && (
          <div className="flex justify-center items-center space-x-4 mt-12">
            {pagination.current_page > 1 ? (
              <a
                href={`/search?q=${encodeURIComponent(searchQuery || '')}&page=${pagination.current_page - 1}`}
                className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                ← Previous
              </a>
            ) : (
              <span className="px-6 py-3 text-gray-400">← Previous</span>
            )}

            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.current_page} of {pagination.last_page}
            </span>

            {pagination.current_page < pagination.last_page ? (
              <a
                href={`/search?q=${encodeURIComponent(searchQuery || '')}&page=${pagination.current_page + 1}`}
                className="px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                Next →
              </a>
            ) : (
              <span className="px-6 py-3 text-gray-400">Next →</span>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
