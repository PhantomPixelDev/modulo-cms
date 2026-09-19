import { Link, usePage } from '@inertiajs/react';
import React from 'react';

interface Widget {
    id: string;
    title: string;
    content: string;
    type: string;
    settings: Record<string, any>;
}

interface RecentPost {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    published_at: string;
    author?: {
        name: string;
    };
    featured_image?: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    posts_count?: number;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface SidebarProps {
    widgets?: Widget[];
    className?: string;
    recentPosts?: RecentPost[];
}

const Sidebar: React.FC<SidebarProps> = ({ widgets = [], className = '', recentPosts = [] }) => {
    let props = { categories: [], tags: [] } as any;
    try {
        const pageProps = usePage<any>();
        // More defensive access to props
        if (pageProps && typeof pageProps === 'object' && pageProps.props && typeof pageProps.props === 'object') {
            props = pageProps.props;
        }
    } catch (error) {
        console.error('Sidebar: Error accessing page props:', error);
    }

    // Ensure props is always an object
    if (!props || typeof props !== 'object') {
        props = { categories: [], tags: [] };
    }

    // Ultra-safe extraction of categories and tags: only accept arrays
    let categories: Category[] = [];
    let tags: Tag[] = [];

    try {
        if (props && Array.isArray(props.categories)) {
            categories = props.categories.filter((cat: Category) => cat && typeof cat === 'object');
        }

        if (props && Array.isArray(props.tags)) {
            tags = props.tags.filter((tag: Tag) => tag && typeof tag === 'object');
        }
    } catch (e) {
        console.warn('Sidebar: Error extracting categories/tags:', e);
        categories = [];
        tags = [];
    }
    // Default widgets if none are provided
    const defaultWidgets: Widget[] = [
        {
            id: 'search',
            title: 'Search',
            content: '',
            type: 'search',
            settings: {},
        },
        {
            id: 'categories',
            title: 'Categories',
            content: '',
            type: 'categories',
            settings: {},
        },
        {
            id: 'tags',
            title: 'Tags',
            content: '',
            type: 'tags',
            settings: {},
        },
    ];

    const activeWidgets = widgets.length > 0 ? widgets : defaultWidgets;

    const renderWidget = (widget: Widget) => {
        switch (widget.type) {
            case 'search':
                return (
                    <div
                        key={widget.id}
                        className="rounded-2xl border border-gray-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    >
                        <div className="mb-4 flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
                        </div>
                        <form action="/search" method="get" className="relative">
                            <input
                                type="text"
                                name="q"
                                placeholder="Search articles..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 px-5 py-3 pr-12 placeholder-gray-500 transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                            />
                            <button
                                type="submit"
                                className="absolute top-1/2 right-2 -translate-y-1/2 transform rounded-lg bg-indigo-600 p-2 text-white transition-all duration-300 hover:scale-105 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </button>
                        </form>
                    </div>
                );

            case 'categories':
                // Only show categories if we have real data
                if (!categories || categories.length === 0) {
                    return null;
                }

                return (
                    <div
                        key={widget.id}
                        className="rounded-2xl border border-gray-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    >
                        <div className="mb-5 flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14-7v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
                        </div>
                        <div className="space-y-3">
                            {Array.isArray(categories) && categories.length > 0
                                ? categories.map((category, idx) => {
                                      try {
                                          if (!category || typeof category !== 'object') return null;

                                          const safeCategory = category || {};
                                          const id = typeof safeCategory.id === 'number' ? safeCategory.id : idx;
                                          const name =
                                              typeof safeCategory.name === 'string' && safeCategory.name.length > 0
                                                  ? safeCategory.name
                                                  : 'Unnamed Category';
                                          const slug =
                                              typeof safeCategory.slug === 'string' && safeCategory.slug.length > 0 ? safeCategory.slug : 'unknown';
                                          const postsCount = typeof safeCategory.posts_count === 'number' ? safeCategory.posts_count : 0;

                                          return (
                                              <Link
                                                  key={id}
                                                  href={`/category/${slug}`}
                                                  className="group flex items-center justify-between rounded-xl border border-gray-100/50 bg-gray-50/50 p-3 transition-all duration-300 hover:border-purple-200/50 hover:bg-purple-50/70 hover:shadow-md"
                                              >
                                                  <span className="font-medium text-gray-800 transition-colors duration-300 group-hover:text-purple-600">
                                                      {name}
                                                  </span>
                                                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 transition-all duration-300 group-hover:bg-indigo-200">
                                                      {postsCount}
                                                  </span>
                                              </Link>
                                          );
                                      } catch (catErr) {
                                          console.warn('Sidebar: Error rendering category:', catErr, category);
                                          return null;
                                      }
                                  })
                                : null}
                        </div>
                    </div>
                );

            case 'tags':
                // Only show tags if we have real data
                if (!tags || tags.length === 0) {
                    return null;
                }

                return (
                    <div
                        key={widget.id}
                        className="rounded-2xl border border-gray-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    >
                        <div className="mb-5 flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(tags) && tags.length > 0
                                ? tags.map((tag, idx) => {
                                      try {
                                          if (!tag || typeof tag !== 'object') return null;

                                          const safeTag = tag || {};
                                          const id = typeof safeTag.id === 'number' ? safeTag.id : idx;
                                          const name = typeof safeTag.name === 'string' && safeTag.name.length > 0 ? safeTag.name : 'Unnamed Tag';
                                          const slug = typeof safeTag.slug === 'string' && safeTag.slug.length > 0 ? safeTag.slug : 'unknown';

                                          return (
                                              <Link
                                                  key={id}
                                                  href={`/tag/${slug}`}
                                                  className="inline-flex transform items-center rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 transition-all duration-300 hover:scale-105 hover:bg-indigo-200 hover:text-indigo-800 hover:shadow-md"
                                              >
                                                  <span className="mr-2 h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                                                  {name}
                                              </Link>
                                          );
                                      } catch (tagErr) {
                                          console.warn('Sidebar: Error rendering tag:', tagErr, tag);
                                          return null;
                                      }
                                  })
                                : null}
                        </div>
                    </div>
                );

            default:
                return (
                    <div
                        key={widget.id}
                        className="rounded-2xl border border-gray-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
                    >
                        <div className="mb-4 flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14-7v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v7z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
                        </div>
                        <div className="leading-relaxed text-gray-600">{widget.content || `This is a ${widget.type} widget.`}</div>
                    </div>
                );
        }
    };

    return <aside className={`space-y-8 ${className}`}>{activeWidgets.map((widget) => renderWidget(widget))}</aside>;
};

export default Sidebar;
