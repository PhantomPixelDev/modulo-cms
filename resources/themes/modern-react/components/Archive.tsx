import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from './Layout';
import PostCard from './partials/PostCard';

interface ArchiveProps {
  title: string;
  posts: any[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const Archive: React.FC<ArchiveProps> = ({ title, posts, pagination }) => {
  return (
    <Layout>
      <Head title={title} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              {pagination.current_page > 1 && (
                <a
                  href={`?page=${pagination.current_page - 1}`}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Previous
                </a>
              )}
              
              <span className="px-4 py-2">
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              
              {pagination.current_page < pagination.last_page && (
                <a
                  href={`?page=${pagination.current_page + 1}`}
                  className="px-4 py-2 border rounded-md hover:bg-gray-100"
                >
                  Next
                </a>
              )}
            </nav>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Archive;
