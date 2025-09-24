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
    <article className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
      {/* Featured Image */}
      {post.featured_image && (
        <div className="aspect-video overflow-hidden">
          <Link href={postUrl}>
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </Link>
        </div>
      )}

      <div className="p-6">
        {/* Post Type Badge */}
        {post.post_type && post.post_type.name !== 'post' && (
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md">
              {post.post_type.label}
            </span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
          <Link 
            href={postUrl}
            className="hover:text-blue-600 transition-colors duration-300"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-4">
          {/* Published Date */}
          <div className="flex items-center gap-2 bg-gray-100/80 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3 h-3 text-blue-500" />
            <time dateTime={post.published_at}>
              {formatDate(post.published_at)}
            </time>
          </div>

          {/* Author */}
          {post.author && (
            <div className="flex items-center gap-2 bg-gray-100/80 px-3 py-1.5 rounded-lg">
              <User className="w-3 h-3 text-purple-500" />
              <span>{post.author.name}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {post.terms && post.terms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.terms.slice(0, 3).map((term) => (
              <span
                key={term.slug}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-100 hover:from-blue-100 hover:to-purple-100 transition-all duration-300"
              >
                <Tag className="w-3 h-3" />
                {term.name}
              </span>
            ))}
            {post.terms.length > 3 && (
              <span className="text-xs text-gray-500 bg-gray-100/80 px-2 py-1 rounded-lg">
                +{post.terms.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Read More Link */}
        <Link
          href={postUrl}
          className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Read more
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
