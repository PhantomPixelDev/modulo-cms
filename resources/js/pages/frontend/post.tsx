import { Head } from '@inertiajs/react';
import { Calendar, User, Eye, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Author {
    id: number;
    name: string;
}

interface PostType {
    id: number;
    name: string;
    label: string;
    slug: string;
}

interface TaxonomyTerm {
    id: number;
    name: string;
    slug: string;
    taxonomy: {
        name: string;
        label: string;
        slug: string;
    };
}

interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featured_image?: string;
    published_at: string;
    view_count: number;
    meta_title?: string;
    meta_description?: string;
    author?: Author;
    post_type: PostType;
    taxonomy_terms: TaxonomyTerm[];
}

interface PostPageProps {
    post: Post;
}

export default function PostPage({ post }: PostPageProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Head title={post.meta_title || post.title}>
                {post.meta_description || post.excerpt ? (
                    <meta name="description" content={post.meta_description || post.excerpt} />
                ) : null}
            </Head>
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <header className="mb-8">
                        <div className="mb-4">
                            <Badge variant="secondary" className="mb-2">
                                {post.post_type.label}
                            </Badge>
                        </div>
                        
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {post.title}
                        </h1>
                        
                        {post.excerpt && (
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                                {post.excerpt}
                            </p>
                        )}
                        
                        {/* Meta information */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            {post.author && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>By {post.author.name}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(post.published_at)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span>{post.view_count} views</span>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {post.featured_image && (
                        <div className="mb-8">
                            <img 
                                src={post.featured_image} 
                                alt={post.title}
                                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <article className="prose prose-lg max-w-none dark:prose-invert mb-8">
                        <div 
                            dangerouslySetInnerHTML={{ __html: post.content }}
                            className="text-gray-800 dark:text-gray-200"
                        />
                    </article>

                    {/* Tags/Taxonomy Terms */}
                    {post.taxonomy_terms.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tags:
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {post.taxonomy_terms.map((term) => (
                                    <Badge key={term.id} variant="outline">
                                        {term.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
