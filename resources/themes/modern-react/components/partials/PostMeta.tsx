import React from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link as LinkIcon } from 'lucide-react';

interface Post {
  id: number;
  title: string;
  slug: string;
  published_at: string;
  updated_at: string;
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
}

interface PostMetaProps {
  post: Post;
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
    };
  };
}

export default function PostMeta({ post, theme }: PostMetaProps) {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(currentUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(currentUrl);
        // You could add a toast notification here
        console.log('URL copied to clipboard');
      } catch (err) {
        console.error('Failed to copy URL');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Author Info */}
      {post.author && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: theme?.colors?.primary || '#3b82f6' }}
            >
              {post.author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="font-semibold text-gray-900">
              {post.author.name}
            </h4>
            <p className="text-sm text-gray-600">
              Author
            </p>
          </div>
        </div>
      )}

      {/* Share Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Share this post</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Twitter */}
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-blue-400 transition-colors duration-200"
              aria-label="Share on Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            
            {/* Facebook */}
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            
            {/* LinkedIn */}
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-blue-700 transition-colors duration-200"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            
            {/* Copy Link */}
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              aria-label="Copy link"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Post Metadata */}
      <div className="text-xs text-gray-500 space-y-1 border-t border-gray-200 pt-6">
        <div>
          <strong>Published:</strong> {formatDate(post.published_at)}
        </div>
        {post.updated_at !== post.published_at && (
          <div>
            <strong>Updated:</strong> {formatDate(post.updated_at)}
          </div>
        )}
        <div>
          <strong>Post ID:</strong> #{post.id}
        </div>
      </div>
    </div>
  );
}
