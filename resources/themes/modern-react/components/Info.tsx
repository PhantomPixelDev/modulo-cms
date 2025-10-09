import React from 'react';
import Layout from './Layout';
import { Link } from '@inertiajs/react';

interface InfoProps {
  post: {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    published_at: string;
    updated_at: string;
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
    terms?: Array<{
      id: number;
      name: string;
      slug: string;
      taxonomy: {
        name: string;
        label: string;
      };
    }>;
  };
  site?: any;
  theme?: any;
  menus?: any;
}

export default function Info({ post, site, theme, menus }: InfoProps) {
  const safeTheme = theme && typeof theme === 'object' ? theme : {};
  const safeSite = site && typeof site === 'object' ? site : { name: 'Modulo CMS' };
  const safeMenus = menus && typeof menus === 'object' ? menus : {};

  return (
    <Layout 
      theme={safeTheme} 
      site={safeSite} 
      menus={safeMenus}
      title={post.title}
      description={post.excerpt}
    >
      <article className="prose prose-lg max-w-none">
        {/* Header */}
        <header className="mb-8 pb-8 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
              Information
            </span>
            {post.published_at && (
              <span className="text-sm text-gray-500">
                {new Date(post.published_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{post.author.name}</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featured_image && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Content */}
        <div 
          className="prose-headings:font-bold prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags/Terms */}
        {post.terms && post.terms.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Topics:</h3>
            <div className="flex flex-wrap gap-2">
              {post.terms.map((term) => (
                <Link
                  key={term.id}
                  href={`/${term.taxonomy.name}/${term.slug}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                >
                  {term.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/infos"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to all information
          </Link>
        </div>
      </article>
    </Layout>
  );
}
