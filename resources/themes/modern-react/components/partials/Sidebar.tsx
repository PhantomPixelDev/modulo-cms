import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import React from 'react';
import { useThemeT } from './ui';

interface Widget {
    id: string;
    title: string;
    content: string;
    type: string;
    settings: Record<string, any>;
}

interface RecentPost {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    published_at: string;
    author?: {
        name: string;
    };
    featured_image?: string;
}

interface Category {
    id: number;
    name: string;
    slug: string;
    posts_count?: number;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface SidebarProps {
    widgets?: Widget[];
    className?: string;
    recentPosts?: RecentPost[];
}

const isNamed = <T extends { name?: unknown; slug?: unknown }>(item: T | null | undefined): item is T =>
    !!item && typeof item === 'object' && typeof item.name === 'string' && typeof item.slug === 'string' && item.slug.length > 0;

function WidgetSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
            {children}
        </section>
    );
}

const Sidebar: React.FC<SidebarProps> = ({ widgets = [], className = '' }) => {
    const tt = useThemeT();
    const { props } = usePage<{ categories?: Category[]; tags?: Tag[]; query?: string }>();

    const categories = Array.isArray(props.categories) ? props.categories.filter(isNamed) : [];
    const tags = Array.isArray(props.tags) ? props.tags.filter(isNamed) : [];

    const defaultWidgets: Widget[] = [
        { id: 'search', title: tt('sidebar.search', 'Search'), content: '', type: 'search', settings: {} },
        { id: 'categories', title: tt('sidebar.categories', 'Categories'), content: '', type: 'categories', settings: {} },
        { id: 'tags', title: tt('sidebar.tags', 'Tags'), content: '', type: 'tags', settings: {} },
    ];

    const activeWidgets = widgets.length > 0 ? widgets : defaultWidgets;

    const renderWidget = (widget: Widget) => {
        switch (widget.type) {
            case 'search':
                return (
                    <form key={widget.id} action="/search" method="get" role="search" className="relative">
                        <label htmlFor={`sidebar-search-${widget.id}`} className="sr-only">
                            {widget.title}
                        </label>
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            id={`sidebar-search-${widget.id}`}
                            type="search"
                            name="q"
                            defaultValue={typeof props.query === 'string' ? props.query : undefined}
                            placeholder={tt('sidebar.search_placeholder', 'Search articles…')}
                            className="h-10 w-full rounded-md border border-input bg-input-bg pr-3 pl-9 text-sm text-foreground shadow-xs transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
                        />
                    </form>
                );

            case 'categories':
                if (categories.length === 0) return null;
                return (
                    <WidgetSection key={widget.id} title={widget.title}>
                        <ul className="-mx-2 space-y-0.5">
                            {categories.map((category) => (
                                <li key={category.id ?? category.slug}>
                                    <Link
                                        href={`/category/${category.slug}`}
                                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                    >
                                        <span className="truncate">{category.name}</span>
                                        {typeof category.posts_count === 'number' && (
                                            <span className="text-xs tabular-nums">{category.posts_count}</span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </WidgetSection>
                );

            case 'tags':
                if (tags.length === 0) return null;
                return (
                    <WidgetSection key={widget.id} title={widget.title}>
                        <div className="flex flex-wrap gap-1.5">
                            {tags.map((tag) => (
                                <Link
                                    key={tag.id ?? tag.slug}
                                    href={`/tag/${tag.slug}`}
                                    className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-input hover:text-foreground"
                                >
                                    #{tag.name}
                                </Link>
                            ))}
                        </div>
                    </WidgetSection>
                );

            default:
                if (!widget.content) return null;
                return (
                    <WidgetSection key={widget.id} title={widget.title}>
                        <div className="text-sm leading-relaxed text-muted-foreground">{widget.content}</div>
                    </WidgetSection>
                );
        }
    };

    return <div className={cn('space-y-8', className)}>{activeWidgets.map((widget) => renderWidget(widget))}</div>;
};

export default Sidebar;
