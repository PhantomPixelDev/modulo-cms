import { router } from '@inertiajs/react';
import React, { useState } from 'react';
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

    // Normalize results to an array
    const results: any[] = Array.isArray((posts as any)?.data) ? (posts as any).data : Array.isArray(posts) ? (posts as any) : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.get('/search', { q: query.trim() });
        }
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
                <header className="rounded-lg bg-indigo-700 py-12 text-center text-white">
                    <h1 className="mb-4 text-4xl font-bold md:text-5xl">{searchQuery ? `Search Results for "${searchQuery}"` : 'Search'}</h1>
                    <p className="text-lg opacity-80">
                        {pagination
                            ? `${pagination.total} ${pagination.total === 1 ? 'result' : 'results'} found`
                            : 'Enter search terms to find content'}
                    </p>
                </header>

                <div className="mx-auto max-w-2xl">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search posts, pages, and content..."
                            className="w-full rounded-xl border border-gray-200 bg-white px-6 py-4 pr-16 text-lg shadow-lg transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!query.trim()}
                            className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded-lg bg-indigo-600 p-3 text-white transition-all duration-300 hover:scale-105 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </form>
                </div>

                {results.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {results.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : searchQuery ? (
                    <div className="py-16 text-center">
                        <div className="mx-auto max-w-md">
                            <div className="mb-6">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-medium text-gray-900">No results found</h3>
                            <p className="text-gray-600">
                                No posts match your search for "{searchQuery}". Try different keywords or check your spelling.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="py-16 text-center">
                        <div className="mx-auto max-w-md">
                            <div className="mb-6">
                                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-medium text-gray-900">Start searching</h3>
                            <p className="text-gray-600">Enter keywords above to search through our posts and pages.</p>
                        </div>
                    </div>
                )}

                {pagination && pagination.last_page > 1 && results.length > 0 && (
                    <div className="mt-12 flex items-center justify-center space-x-4">
                        {pagination.current_page > 1 ? (
                            <a
                                href={`/search?q=${encodeURIComponent(searchQuery || '')}&page=${pagination.current_page - 1}`}
                                className="rounded-lg border border-gray-200 bg-white px-6 py-3 transition-colors duration-300 hover:bg-gray-50"
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
                                className="rounded-lg border border-gray-200 bg-white px-6 py-3 transition-colors duration-300 hover:bg-gray-50"
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
