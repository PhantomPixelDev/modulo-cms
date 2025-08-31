import React from 'react';
import { Link } from '@inertiajs/react';
import { Calendar, User, Tag } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  featured_image?: string;
  published_at: string;
  author?: {
    name: string;
    avatar?: string;
  };
  post_type?: {
    name: string;
    label: string;
    route_prefix?: string;
  };
  terms?: Array<{
    name: string;
    slug: string;
  }>;
}

interface PostCardProps {
  post: Post;
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export default function PostCard({ post, theme }: PostCardProps) {
  const postUrl = post.post_type?.route_prefix 
    ? `/${post.post_type.route_prefix}/${post.slug}`
    : `/posts/${post.slug}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Featured Image */}
      {post.featured_image && (
        <div className="aspect-video overflow-hidden">
          <Link href={postUrl}>
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      )}

      <div className="p-6">
        {/* Post Type Badge */}
        {post.post_type && post.post_type.name !== 'post' && (
          <div className="mb-3">
            <span 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: theme?.colors?.primary || '#3b82f6' }}
            >
              {post.post_type.label}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
          <Link 
            href={postUrl}
            className="hover:text-gray-700 transition-colors duration-200"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
          {/* Published Date */}
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <time dateTime={post.published_at}>
              {formatDate(post.published_at)}
            </time>
          </div>

          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{post.author.name}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.terms && post.terms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.terms.slice(0, 3).map((term) => (
              <span
                key={term.slug}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
              >
                <Tag className="w-3 h-3" />
                {term.name}
              </span>
            ))}
            {post.terms.length > 3 && (
              <span className="text-xs text-gray-500">
                +{post.terms.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Read More Link */}
        <Link
          href={postUrl}
          className="inline-flex items-center text-sm font-medium transition-colors duration-200"
          style={{ color: theme?.colors?.primary || '#3b82f6' }}
        >
          Read more
          <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
