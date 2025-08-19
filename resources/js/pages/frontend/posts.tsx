import { Head, Link } from '@inertiajs/react';
import { Calendar, User, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Author {
    id: number;
    name: string;
}

interface PostType {
    id: number;
    name: string;
    label: string;
    slug: string;
    route_prefix?: string | null;
}

interface TaxonomyTerm {
    id: number;
    name: string;
    slug: string;
}

interface Post {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    featured_image?: string;
    published_at: string;
    view_count: number;
    author?: Author;
    post_type: PostType;
    taxonomy_terms: TaxonomyTerm[];
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more_pages: boolean;
}

interface Filters {
    type?: string;
}

interface PostsPageProps {
    posts: {
        data: Post[];
    };
    pagination: Pagination;
    filters?: Filters;
    postTypes?: PostType[];
    basePath?: string; // e.g., "/news", "/posts", "/pages"
    pageTitle?: string; // e.g., "News", "Posts", "Pages"
    showFilters?: boolean; // control UI
}

export default function PostsPage({ posts, pagination, basePath = '/posts', pageTitle = 'Posts', showFilters = false }: PostsPageProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Build post URL, treating route_prefix '/' as empty
    const getPostUrl = (post: Post) => {
        const rp = post.post_type.route_prefix;
        return rp && rp !== '/' ? `/${rp}/${post.slug}` : `/${post.slug}`;
    };

    const getPaginationUrl = (page: number) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        return `${basePath}?${params.toString()}`;
    };

    return (
        <>
            <Head title={pageTitle} />
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{pageTitle}</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300">
                            Discover our latest content and insights
                        </p>
                    </header>

                    {/* Filters removed; index routes determine content */}

                    {/* Posts Grid */}
                    {posts.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {posts.data.map((post) => (
                                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    {post.featured_image && (
                                        <div className="aspect-video overflow-hidden">
                                            <img 
                                                src={post.featured_image} 
                                                alt={post.title}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {post.post_type.label}
                                            </Badge>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Eye className="h-3 w-3" />
                                                {post.view_count}
                                            </div>
                                        </div>
                                        
                                        <Link href={getPostUrl(post)}>
                                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                                                {post.title}
                                            </h2>
                                        </Link>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        {post.excerpt && (
                                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                                                {post.excerpt}
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-4">
                                                {post.author && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        <span>{post.author.name}</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{formatDate(post.published_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {post.taxonomy_terms.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {post.taxonomy_terms.map((term) => (
                                                    <Badge key={term.id} variant="outline" className="text-xs">
                                                        {term.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <Link href={getPostUrl(post)}>
                                            <Button className="w-full mt-4" variant="outline" size="sm">
                                                Read More
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                No posts found.
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2">
                            {pagination.current_page > 1 && (
                                <Link href={getPaginationUrl(pagination.current_page - 1)}>
                                    <Button variant="outline" size="sm">
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Previous
                                    </Button>
                                </Link>
                            )}
                            
                            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                                Page {pagination.current_page} of {pagination.last_page}
                            </span>
                            
                            {pagination.has_more_pages && (
                                <Link href={getPaginationUrl(pagination.current_page + 1)}>
                                    <Button variant="outline" size="sm">
                                        Next
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
