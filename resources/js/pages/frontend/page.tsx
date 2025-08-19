import { Head } from '@inertiajs/react';
import { Calendar, User, Eye, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Author {
    id: number;
    name: string;
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

interface Page {
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
    taxonomy_terms: TaxonomyTerm[];
}

interface PageProps {
    page: Page;
}

export default function PageComponent({ page }: PageProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <Head title={page.meta_title || page.title}>
                {page.meta_description || page.excerpt ? (
                    <meta name="description" content={page.meta_description || page.excerpt} />
                ) : null}
            </Head>
            
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <header className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                            {page.title}
                        </h1>
                        
                        {page.excerpt && (
                            <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
                                {page.excerpt}
                            </p>
                        )}
                        
                        {/* Meta information */}
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                            {page.author && (
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>By {page.author.name}</span>
                                </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>Updated {formatDate(page.published_at)}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                <span>{page.view_count} views</span>
                            </div>
                        </div>
                    </header>

                    {/* Featured Image */}
                    {page.featured_image && (
                        <div className="mb-8">
                            <img 
                                src={page.featured_image} 
                                alt={page.title}
                                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <article className="prose prose-lg max-w-none dark:prose-invert mb-8">
                        <div 
                            dangerouslySetInnerHTML={{ __html: page.content }}
                            className="text-gray-800 dark:text-gray-200"
                        />
                    </article>

                    {/* Tags/Taxonomy Terms */}
                    {page.taxonomy_terms.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tags:
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {page.taxonomy_terms.map((term) => (
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
