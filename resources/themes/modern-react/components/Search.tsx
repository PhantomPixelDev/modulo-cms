import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import Layout from './Layout';
import PostCard from './partials/PostCard';

interface SearchProps {
  results: any[];
  query: string;
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const Search: React.FC<SearchProps> = ({ results, query, pagination }) => {
  const [searchQuery, setSearchQuery] = useState(query || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/search', { q: searchQuery });
  };

  return (
    <Layout>
      <Head title={`Search Results for "${query}"`} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Search Results for "{query}"</h1>
        
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>

        {results.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {pagination && pagination.last_page > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  {pagination.current_page > 1 && (
                    <a
                      href={`/search?q=${encodeURIComponent(query)}&page=${pagination.current_page - 1}`}
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
                      href={`/search?q=${encodeURIComponent(query)}&page=${pagination.current_page + 1}`}
                      className="px-4 py-2 border rounded-md hover:bg-gray-100"
                    >
                      Next
                    </a>
                  )}
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No results found for "{query}"</p>
            <p className="text-gray-500 mt-2">Try different search terms</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Search;
