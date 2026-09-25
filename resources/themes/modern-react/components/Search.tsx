import { router } from '@inertiajs/react';
import { SearchIcon, SearchX } from 'lucide-react';
import React, { useState } from 'react';
import Layout from './Layout';
import PostCard from './partials/PostCard';
import { buttonClass, EmptyState, PageHeader, Pagination, useThemeT } from './partials/ui';

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
    const tt = useThemeT();
    const [query, setQuery] = useState(searchQuery || '');

    // Normalize results to an array
    const results: any[] = Array.isArray((posts as any)?.data) ? (posts as any).data : Array.isArray(posts) ? (posts as any) : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.get('/search', { q: query.trim() });
        }
    };

    const pageUrl = (page: number) => `/search?q=${encodeURIComponent(searchQuery || '')}&page=${page}`;
    const current = pagination?.current_page ?? 1;
    const last = pagination?.last_page ?? 1;
    const title = searchQuery ? tt('search.results_for', 'Results for “:query”', { query: searchQuery }) : tt('search.title', 'Search');
    const total = pagination?.total ?? results.length;

    return (
        <Layout
            theme={props.theme}
            site={props.site}
            menus={props.menus}
            title={title}
            description={searchQuery ? title : tt('search.title', 'Search')}
        >
            <div className="mx-auto max-w-4xl">
                <PageHeader
                    title={title}
                    description={
                        searchQuery
                            ? total === 1
                                ? tt('search.count_one', '1 result found')
                                : tt('search.count_other', ':count results found', { count: total })
                            : tt('search.prompt', 'Enter search terms to find content')
                    }
                />

                <form onSubmit={handleSubmit} role="search" className="mb-10 flex gap-2">
                    <div className="relative flex-1">
                        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label={tt('search.title', 'Search')}
                            placeholder={tt('search.placeholder', 'Search posts, pages, and content…')}
                            className="h-11 w-full rounded-md border border-input bg-input-bg pr-4 pl-10 text-base text-foreground shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        />
                    </div>
                    <button type="submit" disabled={!query.trim()} className={buttonClass('primary', 'lg')}>
                        {tt('search.submit', 'Search')}
                    </button>
                </form>

                {results.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                        {results.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : searchQuery ? (
                    <EmptyState
                        icon={SearchX}
                        title={tt('search.empty_title', 'No results found')}
                        description={tt('search.empty_description', 'Nothing matches “:query”. Try different keywords or check your spelling.', {
                            query: searchQuery,
                        })}
                    />
                ) : (
                    <EmptyState
                        icon={SearchIcon}
                        title={tt('search.start_title', 'Start searching')}
                        description={tt('search.start_description', 'Enter keywords above to search through our posts and pages.')}
                    />
                )}

                {results.length > 0 && (
                    <Pagination
                        pagination={{
                            current_page: current,
                            last_page: last,
                            prev_page_url: current > 1 ? pageUrl(current - 1) : null,
                            next_page_url: current < last ? pageUrl(current + 1) : null,
                        }}
                    />
                )}
            </div>
        </Layout>
    );
};

export default Search;
