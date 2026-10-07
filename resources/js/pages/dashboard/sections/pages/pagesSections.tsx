import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';
import { submitEditor, type EditorContent, type EditorSubmission } from '../../components/common/editor';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PageForm, type PageFormProps } from '../../components/pages/PageForm';
import { PostList } from '../../components/posts/PostList';
import type { ROUTE as DashboardRoutes } from '../../routes';
import type { CustomFieldDefinition } from '../../types';

export function getPagesSections({
    postsProp,
    post,
    editPost,
    authors,
    filters,
    pageParents,
    pageFields,
    defaultStatus,
    canEditAuthorFlag,
    locales,
    currentLocale,
    translation,
    can,
    showSuccess,
    showError,
    ROUTE,
    t,
}: {
    postsProp?: ComponentProps<typeof PostList>['posts'];
    post?: EditorContent;
    editPost?: EditorContent;
    authors?: Array<{ id: number; name: string }>;
    filters?: Record<string, string>;
    pageParents?: Array<{ id: number; title: string }>;
    pageFields?: CustomFieldDefinition[];
    defaultStatus?: string;
    canEditAuthorFlag?: boolean;
    locales?: ComponentProps<typeof PostList>['locales'];
    currentLocale?: string;
    translation?: PageFormProps['translation'];
    can: (perm: string) => boolean;
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
    ROUTE: typeof DashboardRoutes;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
    const handlePageSubmit = (formData: EditorSubmission, editId?: number) =>
        submitEditor(editId ? ROUTE.pages.update(editId) : ROUTE.pages.store(), editId ? 'put' : 'post', {
            ...formData,
            locale: currentLocale || 'en',
        });

    const handleDeletePage = async (page: EditorContent | undefined) => {
        if (!page?.id) return;
        const name = page?.title || t('dashboard.common.item');
        if (!window.confirm(t('dashboard.pages.confirm_delete', { name }))) return;
        try {
            await router.delete(ROUTE.pages.destroy(page.id), {
                onSuccess: () => {
                    showSuccess(t('dashboard.pages.messages.deleted'));
                    router.visit(ROUTE.pages.index());
                },
                onError: () => showError(t('dashboard.pages.messages.delete_failed')),
                preserveScroll: true,
            });
        } catch (error) {
            console.error('Error deleting page:', error);
            showError(t('dashboard.pages.messages.delete_error'));
        }
    };

    const handleLocaleChange = (locale: string) => {
        router.visit(`${window.location.pathname}?locale=${encodeURIComponent(locale)}`);
    };

    const renderPagesList = () => (
        <SectionWrapper
            title={t('dashboard.pages.title')}
            description={t('dashboard.pages.list_description')}
            actions={
                can('create pages') ? (
                    <Button size="sm" onClick={() => router.visit(ROUTE.pages.create())}>
                        {t('dashboard.pages.actions.new')}
                    </Button>
                ) : null
            }
        >
            <PostList
                posts={postsProp ?? []}
                filters={filters}
                authors={authors}
                showTypeFilter={false}
                locales={locales}
                canEdit={can('edit pages')}
                canDelete={can('delete pages')}
                canPublish={can('publish content')}
                editHref={(item) => ROUTE.pages.edit(item.id)}
                viewHref={(item) => (item.status === 'published' && !item.is_scheduled && item.slug ? `/${item.slug}` : null)}
                searchPlaceholder={t('dashboard.pages.search')}
                emptyText={t('dashboard.pages.empty.description')}
            />
        </SectionWrapper>
    );

    const renderPageCreate = () => (
        <SectionWrapper
            title={t('dashboard.pages.create_title')}
            description={t('dashboard.pages.create_description')}
            actions={
                <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
                    {t('dashboard.pages.actions.back')}
                </Button>
            }
        >
            <PageForm
                key={`new-page-${currentLocale || 'en'}`}
                isEditing={false}
                parents={pageParents}
                fields={pageFields}
                authors={authors}
                canEditAuthor={canEditAuthorFlag}
                canPublish={can('publish content')}
                defaultStatus={defaultStatus}
                locales={locales}
                currentLocale={currentLocale || 'en'}
                onLocaleChange={handleLocaleChange}
                onSubmit={(data) => handlePageSubmit(data)}
                onCancel={() => router.visit(ROUTE.pages.index())}
            />
        </SectionWrapper>
    );

    const renderPageEdit = () => (
        <SectionWrapper
            title={t('dashboard.pages.edit_title')}
            description={t('dashboard.pages.edit_description')}
            actions={
                <div className="flex gap-2">
                    {can('delete pages') && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeletePage(post || editPost)}>
                            {t('dashboard.pages.actions.delete')}
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
                        {t('dashboard.pages.actions.back')}
                    </Button>
                </div>
            }
        >
            <PageForm
                key={`page-${(post || editPost)?.id ?? 'new'}-${currentLocale || 'en'}`}
                page={post || editPost}
                isEditing={true}
                parents={pageParents}
                fields={pageFields}
                authors={authors}
                canEditAuthor={canEditAuthorFlag}
                canPublish={can('publish content')}
                locales={locales}
                currentLocale={currentLocale || 'en'}
                translation={translation}
                onLocaleChange={handleLocaleChange}
                deleteTranslationRoute={
                    translation && (post || editPost)?.id
                        ? route('dashboard.admin.pages.translations.destroy', {
                              post: (post || editPost)?.id,
                              locale: currentLocale || 'en',
                          })
                        : undefined
                }
                onSubmit={(data) => handlePageSubmit(data, (post || editPost)?.id)}
                onCancel={() => router.visit(ROUTE.pages.index())}
            />
        </SectionWrapper>
    );

    return {
        pages: renderPagesList,
        'pages.create': renderPageCreate,
        'pages.edit': renderPageEdit,
    };
}
