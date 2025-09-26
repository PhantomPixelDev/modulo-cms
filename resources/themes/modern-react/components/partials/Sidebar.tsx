import React from 'react';
import { Link, usePage } from '@inertiajs/react';

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

const Sidebar: React.FC<SidebarProps> = ({ 
  widgets = [], 
  className = '', 
  recentPosts = [] 
}) => {
  const { props } = usePage<any>();
  
  // Extract categories and tags from shared page data
  const categories: Category[] = props.categories || [];
  const tags: Tag[] = props.tags || [];
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
          <div key={widget.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
            </div>
            <form action="/search" method="get" className="relative">
              <input
                type="text"
                name="q"
                placeholder="Search articles..."
                className="w-full px-5 py-3 pr-12 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 placeholder-gray-500"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          <div key={widget.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
            </div>
            <div className="space-y-3">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 hover:bg-purple-50/70 border border-gray-100/50 hover:border-purple-200/50 transition-all duration-300 hover:shadow-md group"
                >
                  <span className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                    {category.name}
                  </span>
                  <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300">
                    {category.posts_count || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );

      case 'tags':
        // Only show tags if we have real data
        if (!tags || tags.length === 0) {
          return null;
        }

        return (
          <div key={widget.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 hover:from-orange-200 hover:to-red-200 text-orange-700 hover:text-red-700 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-md transform hover:scale-105"
                >
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={widget.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7v14a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2h10a2 2 0 012 2v7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">{widget.title}</h3>
            </div>
            <div className="text-gray-600 leading-relaxed">
              {widget.content || `This is a ${widget.type} widget.`}
            </div>
          </div>
        );
    }
  };

  return (
    <aside className={`space-y-8 ${className}`}>
      {activeWidgets.map((widget) => renderWidget(widget))}
    </aside>
  );
};

export default Sidebar;
