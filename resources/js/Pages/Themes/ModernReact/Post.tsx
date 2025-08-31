import React from 'react';
import Layout from './Layout';
import PostMeta from './partials/PostMeta';
import { Calendar, User, Tag, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  author?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  post_type?: {
    name: string;
    label: string;
    route_prefix?: string;
  };
  terms?: Array<{
    id: number;
    name: string;
    slug: string;
    taxonomy?: {
      name: string;
      label: string;
    };
  }>;
}

interface PostProps {
  post: Post;
  site?: any;
  theme?: any;
  menus?: any;
  relatedPosts?: Post[];
}

export default function Post({ post, site, theme, menus, relatedPosts }: PostProps) {
  // Ensure safe defaults to prevent Object.keys errors
  const safePost = post || { title: 'Untitled', content: '', published_at: new Date().toISOString() };
  const safeSite = site || { name: 'Modulo CMS' };
  const safeTheme = theme || { colors: { primary: '#3b82f6' } };
  const safeMenus = menus || { primary: [], footer: [] };
  const safeRelatedPosts = relatedPosts || [];

  const backUrl = safePost.post_type?.route_prefix 
    ? `/${safePost.post_type.route_prefix}`
    : '/';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout
      title={safePost.meta_title || safePost.title}
      description={safePost.meta_description || safePost.excerpt}
      ogImage={safePost.featured_image}
      site={safeSite}
      theme={safeTheme}
      menus={safeMenus}
    >
      <div className="py-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link
            href={backUrl}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {safePost.post_type?.label || 'Posts'}
          </Link>
        </div>

        <article className="max-w-4xl mx-auto">
          {/* Post Header */}
          <header className="mb-8">
            {/* Post Type Badge */}
            {safePost.post_type && safePost.post_type.name !== 'post' && (
              <div className="mb-4">
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: safeTheme?.colors?.primary || '#3b82f6' }}
                >
                  {safePost.post_type.label}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {safePost.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
              {/* Published Date */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={safePost.published_at}>
                  {formatDate(safePost.published_at)}
                </time>
              </div>

              {/* Author */}
              {safePost.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>By {safePost.author.name}</span>
                </div>
              )}

              {/* Reading Time Estimate */}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{Math.ceil((safePost.content || '').split(' ').length / 200)} min read</span>
              </div>
            </div>

            {/* Tags */}
            {safePost.terms && safePost.terms.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {safePost.terms.map((term) => (
                  <span
                    key={term.id}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Tag className="w-3 h-3" />
                    {term.name}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Featured Image */}
          {safePost.featured_image && (
            <div className="mb-8">
              <img
                src={safePost.featured_image}
                alt={safePost.title}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Post Content */}
          <div 
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: safePost.content || '' }}
          />

          {/* Post Footer */}
          <footer className="border-t border-gray-200 pt-8">
            <PostMeta 
              post={safePost}
              theme={safeTheme}
            />
          </footer>
        </article>

        {/* Related Posts */}
        {safeRelatedPosts && safeRelatedPosts.length > 0 && (
          <section className="mt-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safeRelatedPosts.slice(0, 3).map((relatedPost) => (
                  <article key={relatedPost.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                    {relatedPost.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <Link href={`/${relatedPost.post_type?.route_prefix || 'posts'}/${relatedPost.slug}`}>
                          <img
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        <Link 
                          href={`/${relatedPost.post_type?.route_prefix || 'posts'}/${relatedPost.slug}`}
                          className="hover:text-gray-700 transition-colors duration-200"
                        >
                          {relatedPost.title}
                        </Link>
                      </h3>
                      {relatedPost.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}
