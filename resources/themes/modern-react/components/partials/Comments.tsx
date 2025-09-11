import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface Comment {
  id: number;
  user_id: number | null;
  author_name: string;
  author_email: string | null;
  author_avatar: string | null;
  content: string;
  created_at: string;
  replies?: Comment[];
}

interface CommentsProps {
  postId: number;
  comments: Comment[];
  allowComments: boolean;
}

const Comments: React.FC<CommentsProps> = ({ postId, comments = [], allowComments = true }) => {
  const { auth } = usePage<PageProps>().props;
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    content: '',
    parent_id: null as number | null,
    author_name: auth.user ? '' : '',
    author_email: auth.user ? '' : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.user && (!data.author_name || !data.author_email)) {
      setShowLoginMessage(true);
      return;
    }

    post(`/posts/${postId}/comments`, {
      onSuccess: () => {
        reset();
        setReplyingTo(null);
        setShowLoginMessage(false);
      },
    });
  };

  const startReply = (commentId: number) => {
    setReplyingTo(commentId);
    setData('parent_id', commentId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setData('parent_id', null);
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div 
      key={comment.id} 
      className={`mt-4 ${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <img
            className="h-10 w-10 rounded-full"
            src={comment.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author_name)}&background=random`}
            alt={comment.author_name}
          />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <h4 className="text-sm font-medium text-gray-900">{comment.author_name}</h4>
            <span className="ml-2 text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {comment.content}
          </div>
          <div className="mt-2 flex items-center">
            <button
              onClick={() => startReply(comment.id)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Reply
            </button>
          </div>

          {replyingTo === comment.id && (
            <div className="mt-3">
              <form onSubmit={handleSubmit}>
                {!auth.user && (
                  <div className="mb-3 space-y-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Your name"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={data.author_name}
                        onChange={(e) => setData('author_name', e.target.value)}
                        required
                      />
                      {errors.author_name && (
                        <p className="mt-1 text-xs text-red-600">{errors.author_name}</p>
                      )}
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Your email"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={data.author_email || ''}
                        onChange={(e) => setData('author_email', e.target.value)}
                        required
                      />
                      {errors.author_email && (
                        <p className="mt-1 text-xs text-red-600">{errors.author_email}</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Write your reply..."
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    required
                  />
                  {errors.content && (
                    <p className="mt-1 text-xs text-red-600">{errors.content}</p>
                  )}
                </div>
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={cancelReply}
                    className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-3 py-1 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-12">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h3>

      {/* Comment Form */}
      {allowComments && (
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Leave a comment</h4>
          
          {showLoginMessage && !auth.user && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md">
              Please enter your name and email to post a comment, or{' '}
              <a href="/login" className="text-blue-600 hover:underline">log in</a> to your account.
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            {!auth.user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <input
                    type="text"
                    placeholder="Your name *"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={data.author_name}
                    onChange={(e) => setData('author_name', e.target.value)}
                    required
                  />
                  {errors.author_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.author_name}</p>
                  )}
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your email *"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={data.author_email || ''}
                    onChange={(e) => setData('author_email', e.target.value)}
                    required
                  />
                  {errors.author_email && (
                    <p className="mt-1 text-xs text-red-600">{errors.author_email}</p>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your comment..."
                value={data.content}
                onChange={(e) => setData('content', e.target.value)}
                required
              />
              {errors.content && (
                <p className="mt-1 text-xs text-red-600">{errors.content}</p>
              )}
            </div>
            
            <div className="mt-3">
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {processing ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => renderComment(comment))
        ) : (
          <p className="text-gray-500">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
};

export default Comments;
