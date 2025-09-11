import React from 'react';
import { Link } from '@inertiajs/react';

interface Widget {
  id: string;
  title: string;
  content: string;
  type: string;
  settings: Record<string, any>;
}

interface SidebarProps {
  widgets?: Widget[];
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ widgets = [], className = '' }) => {
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
      id: 'recent-posts',
      title: 'Recent Posts',
      content: '',
      type: 'recent-posts',
      settings: { count: 5 },
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
          <div key={widget.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{widget.title}</h3>
            <form action="/search" method="get" className="flex">
              <input
                type="text"
                name="q"
                placeholder="Search..."
                className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
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

      case 'recent-posts':
        const count = widget.settings?.count || 5;
        // In a real app, these would come from props or a data fetch
        const recentPosts = Array(count).fill(0).map((_, i) => ({
          id: i + 1,
          title: `Recent Post ${i + 1}`,
          url: `/blog/post-${i + 1}`,
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        }));

        return (
          <div key={widget.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{widget.title}</h3>
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={post.url}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {post.title}
                  </Link>
                  <div className="text-sm text-gray-500">{post.date}</div>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'categories':
        // In a real app, these would come from props or a data fetch
        const categories = [
          { id: 1, name: 'Technology', count: 5, slug: 'technology' },
          { id: 2, name: 'Web Development', count: 8, slug: 'web-development' },
          { id: 3, name: 'Design', count: 3, slug: 'design' },
          { id: 4, name: 'Business', count: 2, slug: 'business' },
        ];

        return (
          <div key={widget.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{widget.title}</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex justify-between">
                  <Link
                    href={`/category/${category.slug}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {category.name}
                  </Link>
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {category.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );

      case 'tags':
        // In a real app, these would come from props or a data fetch
        const tags = [
          { id: 1, name: 'React', slug: 'react' },
          { id: 2, name: 'TypeScript', slug: 'typescript' },
          { id: 3, name: 'Laravel', slug: 'laravel' },
          { id: 4, name: 'Tailwind CSS', slug: 'tailwind-css' },
          { id: 5, name: 'JavaScript', slug: 'javascript' },
          { id: 6, name: 'PHP', slug: 'php' },
        ];

        return (
          <div key={widget.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{widget.title}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={widget.id} className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">{widget.title}</h3>
            <div className="text-gray-600">
              {widget.content || `This is a ${widget.type} widget.`}
            </div>
          </div>
        );
    }
  };

  return (
    <aside className={`space-y-6 ${className}`}>
      {activeWidgets.map((widget) => renderWidget(widget))}
    </aside>
  );
};

export default Sidebar;
