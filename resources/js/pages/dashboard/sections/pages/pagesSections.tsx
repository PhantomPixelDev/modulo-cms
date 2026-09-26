import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PageForm } from '../../components/pages/PageForm';
import { PostList } from '../../components/posts/PostList';

export function getPagesSections({
    postsProp,
    post,
    editPost,
    authors,
    filters,
    can,
    showSuccess,
    showError,
    ROUTE,
    t,
}: {
    postsProp: any;
    post: any;
    editPost: any;
    authors?: Array<{ id: number; name: string }>;
    filters?: Record<string, string>;
    can: (perm: string) => boolean;
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
    ROUTE: any;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
    const handlePageSubmit = async (formData: any, editId?: number) => {
        const url = editId ? ROUTE.pages.update(editId) : ROUTE.pages.store();
        const method = editId ? 'put' : 'post';
        try {
            router[method](url, formData, {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(t(editId ? 'dashboard.pages.messages.updated' : 'dashboard.pages.messages.created'));
                    router.visit(ROUTE.pages.index());
                },
                onError: (errors) => {
                    console.error('Validation errors:', errors);
                    showError(t(editId ? 'dashboard.pages.messages.update_failed' : 'dashboard.pages.messages.create_failed'));
                },
            });
        } catch (error) {
            console.error('Error saving page:', error);
            showError(t(editId ? 'dashboard.pages.messages.update_failed' : 'dashboard.pages.messages.create_failed'));
        }
    };

    const handleDeletePage = async (page: any) => {
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

    const renderPagesList = () => (
        <SectionWrapper
            title={t('dashboard.pages.title')}
            description={t('dashboard.pages.list_description')}
            actions={
                can('create posts') ? (
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
                canEdit={can('edit posts')}
                canDelete={can('delete posts')}
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
            <PageForm isEditing={false} onSubmit={(data) => handlePageSubmit(data)} onCancel={() => router.visit(ROUTE.pages.index())} />
        </SectionWrapper>
    );

    const renderPageEdit = () => (
        <SectionWrapper
            title={t('dashboard.pages.edit_title')}
            description={t('dashboard.pages.edit_description')}
            actions={
                <div className="flex gap-2">
                    {can('delete posts') && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeletePage((post as any) || (editPost as any))}>
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
                page={(post as any) || (editPost as any)}
                isEditing={true}
                onSubmit={(data) => handlePageSubmit(data, ((post as any) || (editPost as any))?.id)}
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
