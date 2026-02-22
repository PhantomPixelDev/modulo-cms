import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ActionButtons } from '@/components/ui/table-actions';
import { DataTable } from '../common/DataTable';
import { PostListItem } from '../../types';
import { ROUTE } from '../../routes';
import { Search, Filter, X, Globe, Plus } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Locale = {
  id: number;
  code: string;
  name: string;
  native_name?: string;
  is_default?: boolean;
};

type PostListProps = {
  posts: PostListItem[] | { data: PostListItem[] };
  locales?: Locale[];
  canCreate?: boolean;
  canEdit?: boolean;
  onCreate?: () => void;
};

const getStatusOptions = (t: (key: string) => string) => [
  { value: 'all', label: t('common.all') },
  { value: 'published', label: t('common.status.published') },
  { value: 'draft', label: t('common.status.draft') },
  { value: 'pending', label: t('common.status.pending') },
  { value: 'private', label: t('common.status.private') },
];

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  published: 'default',
  draft: 'secondary',
  pending: 'outline',
  private: 'destructive',
};

export function PostList({ posts, locales = [], canCreate = false, canEdit = false, onCreate }: PostListProps) {
  const { t } = useTranslation();
  const allItems: PostListItem[] = Array.isArray(posts) ? posts : posts?.data || [];
  const getRouteIdentifier = (item: PostListItem) => item.slug || item.id;
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Extract unique authors and types for filter options
  const authors = useMemo(() => {
    const uniqueAuthors = new Map<number, string>();
    allItems.forEach(item => {
      if (item.author?.id && item.author?.name) {
        uniqueAuthors.set(item.author.id, item.author.name);
      }
    });
    return Array.from(uniqueAuthors, ([id, name]) => ({ id, name }));
  }, [allItems]);

  const postTypes = useMemo(() => {
    const uniqueTypes = new Map<number, string>();
    allItems.forEach(item => {
      if (item.post_type?.id && (item.post_type?.label || item.post_type?.name)) {
        uniqueTypes.set(item.post_type.id, item.post_type.label || item.post_type.name);
      }
    });
    return Array.from(uniqueTypes, ([id, label]) => ({ id, label }));
  }, [allItems]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          item.title?.toLowerCase().includes(term) ||
          item.slug?.toLowerCase().includes(term) ||
          item.author?.name?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      
      // Author filter
      if (authorFilter !== 'all' && String(item.author?.id) !== authorFilter) return false;
      
      // Type filter
      if (typeFilter !== 'all' && String(item.post_type?.id) !== typeFilter) return false;
      
      return true;
    });
  }, [allItems, searchTerm, statusFilter, authorFilter, typeFilter]);

  const hasActiveFilters = statusFilter !== 'all' || authorFilter !== 'all' || typeFilter !== 'all' || searchTerm !== '';

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAuthorFilter('all');
    setTypeFilter('all');
  };

  const statusOptions = getStatusOptions(t);

  const renderLocaleBadges = (item: PostListItem) => {
    const postTranslations = (item as any).translations || [];
    const translatedLocales = postTranslations.map((t: any) => t.locale);
    
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {locales.map((locale) => {
            const hasTranslation = translatedLocales.includes(locale.code);
            return (
              <Tooltip key={locale.code}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const editUrl = ROUTE.posts.edit(getRouteIdentifier(item));
                      router.visit(`${editUrl}?locale=${locale.code}`);
                    }}
                    className={`
                      inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded text-xs font-medium transition-colors
                      ${hasTranslation 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-dashed'
                      }
                    `}
                  >
                    {hasTranslation ? locale.code.toUpperCase() : <Plus className="h-3 w-3" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {hasTranslation 
                    ? `${t('dashboard.posts.translations.edit')} (${locale.native_name || locale.name})`
                    : `${t('dashboard.posts.translations.add')} (${locale.native_name || locale.name})`
                  }
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  };

  const columns = [
    { key: 'title', label: t('dashboard.posts.post_title'), sortable: true },
    ...(locales.length > 1 ? [{ 
      key: 'translations', 
      label: t('dashboard.posts.translations.label'), 
      sortable: false, 
      render: renderLocaleBadges 
    }] : []),
    { key: 'post_type', label: t('dashboard.posts.post_type'), sortable: false, render: (item: PostListItem) => (
      <Badge variant="outline">{item.post_type?.label || item.post_type?.name || '—'}</Badge>
    )},
    { key: 'status', label: t('dashboard.posts.post_status'), sortable: true, render: (item: PostListItem) => (
      <Badge variant={statusColors[item.status] || 'secondary'}>
        {t(`common.status.${item.status}`)}
      </Badge>
    )},
    { key: 'author', label: t('dashboard.posts.post_author'), sortable: false, render: (item: PostListItem) => item.author?.name || '—' },
    { key: 'created_at', label: t('dashboard.posts.post_date'), sortable: true, render: (item: PostListItem) => new Date(item.created_at).toLocaleDateString() },
  ];

  const actions = (item: PostListItem) => (
    <ActionButtons
      onView={() => router.visit(ROUTE.posts.show(getRouteIdentifier(item)))}
      onEdit={canEdit ? () => router.visit(ROUTE.posts.edit(getRouteIdentifier(item))) : undefined}
      showView={true}
      showEdit={canEdit}
      showDelete={false}
    />
  );

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dashboard.posts.search_posts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Author Filter */}
          {authors.length > 0 && (
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Author" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.posts.filter_by_author')}</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author.id} value={String(author.id)}>{author.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Post Type Filter */}
          {postTypes.length > 1 && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.posts.filter_by_type')}</SelectItem>
                {postTypes.map(type => (
                  <SelectItem key={type.id} value={String(type.id)}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="h-4 w-4 mr-1" />
              {t('common.actions.clear')}
            </Button>
          )}
        </div>

        {canCreate && (
          <Button onClick={onCreate} size="sm">{t('dashboard.posts.add_new')}</Button>
        )}
      </div>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          {t('common.pagination.showing', { from: '1', to: String(filteredItems.length), total: String(allItems.length) })}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={filteredItems}
        columns={columns}
        actions={actions}
        itemsPerPage={15}
        searchFields={[]}
      />
    </div>
  );
}
