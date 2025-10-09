import React from 'react';

interface Post {
    id: number;
    title: string;
    excerpt: string;
}

interface PaginatedPosts {
    data: Post[];
}

interface PostsProps {
    posts: PaginatedPosts;
}

const Posts: React.FC<PostsProps> = ({ posts }) => {
    return (
        <div>
            <h1>Posts</h1>
            {posts && posts.data && posts.data.length > 0 ? (
                <ul>
                    {posts.data.map((post: Post) => (
                        <li key={post.id}>
                            <h2>{post.title}</h2>
                            <p>{post.excerpt}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No posts found.</p>
            )}
        </div>
    );
};

export default Posts;
