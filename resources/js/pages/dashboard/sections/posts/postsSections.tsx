import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import type { ComponentProps, ReactNode } from 'react';
import { submitEditor, type EditorSubmission } from '../../components/common/editor';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PostForm } from '../../components/posts/PostForm';
import { PostList } from '../../components/posts/PostList';
import { PostView } from '../../components/posts/PostView';
import type { PostFormProps, PostType } from '../../components/posts/types';
import type { ROUTE as DashboardRoutes } from '../../routes';

export function getPostsSections({
    postsProp,
    editPost,
    post,
    postTypes,
    currentPostType,
    groupedTerms,
    authors,
    filters,
    parentsByType,
    locales,
    currentLocale,
    translation,
    can,
    canEditAuthorFlag,
    showSuccess,
    showError,
    ROUTE,
    t,
}: {
    postsProp?: ComponentProps<typeof PostList>['posts'];
    editPost?: ComponentProps<typeof PostView>['post'];
    post?: ComponentProps<typeof PostView>['post'];
    postTypes: PostFormProps['postTypes'];
    currentPostType?: PostType & { plural_label?: string };
    groupedTerms: PostFormProps['groupedTerms'];
    authors: PostFormProps['authors'];
    filters?: Record<string, string>;
    parentsByType: PostFormProps['parentsByType'];
    locales?: PostFormProps['locales'];
    currentLocale?: string;
    translation?: PostFormProps['translation'];
    can: (perm: string) => boolean;
    canEditAuthorFlag: boolean;
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
    ROUTE: typeof DashboardRoutes;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
    // Get the display name for the current post type
    const postTypeName = currentPostType?.label || currentPostType?.plural_label || t('dashboard.posts.title');
    const postTypeSingular = currentPostType?.label || currentPostType?.name || t('dashboard.posts.singular');
    const handlePostSubmit = (formData: EditorSubmission, editId?: number) =>
        submitEditor(editId ? ROUTE.posts.update(editId) : ROUTE.posts.store(), editId ? 'put' : 'post', {
            ...formData,
            locale: currentLocale || 'en',
        });

    const handleLocaleChange = (locale: string) => {
        const currentUrl = window.location.pathname;
        router.visit(`${currentUrl}?locale=${locale}`);
    };

    const renderPostsList = () => {
        return (
            <SectionWrapper
                title={postTypeName}
                description={t('dashboard.posts.list_description', { type: postTypeName.toLowerCase() })}
                actions={
                    can('create posts') ? (
                        <Button size="sm" onClick={() => router.visit(ROUTE.posts.create())}>
                            {t('dashboard.posts.actions.new', { type: postTypeSingular })}
                        </Button>
                    ) : null
                }
            >
                <PostList
                    posts={postsProp ?? []}
                    filters={filters}
                    authors={authors}
                    postTypes={postTypes}
                    showTypeFilter={!currentPostType}
                    locales={locales}
                    canEdit={can('edit posts')}
                    canDelete={can('delete posts')}
                    canPublish={can('publish posts')}
                />
            </SectionWrapper>
        );
    };

    const renderPostCreate = () => (
        <SectionWrapper
            title={t('dashboard.posts.create_title', { type: postTypeSingular })}
            description={t('dashboard.posts.create_description', { type: postTypeSingular.toLowerCase() })}
            actions={
                <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
                    {t('dashboard.posts.actions.back', { type: postTypeName })}
                </Button>
            }
        >
            <PostForm
                key={`new-${currentLocale || 'en'}`}
                isEditing={false}
                postTypes={postTypes || []}
                groupedTerms={groupedTerms || {}}
                authors={authors || []}
                parentsByType={parentsByType || {}}
                locales={locales}
                currentLocale={currentLocale || 'en'}
                canEditAuthor={canEditAuthorFlag}
                canPublish={can('publish posts')}
                onSubmit={(data) => handlePostSubmit(data)}
                onCancel={() => router.visit(ROUTE.posts.index())}
                onLocaleChange={handleLocaleChange}
            />
        </SectionWrapper>
    );

    const renderPostEdit = () => (
        <SectionWrapper
            title={t('dashboard.posts.edit_title', { type: postTypeSingular })}
            description={t('dashboard.posts.edit_description', { type: postTypeSingular.toLowerCase() })}
            actions={
                <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
                    {t('dashboard.posts.actions.back', { type: postTypeName })}
                </Button>
            }
        >
            <PostForm
                key={`${editPost?.id ?? 'new'}-${currentLocale || 'en'}`}
                post={editPost}
                translation={translation}
                postTypes={postTypes || []}
                groupedTerms={groupedTerms || {}}
                authors={authors || []}
                parentsByType={parentsByType || {}}
                locales={locales}
                currentLocale={currentLocale || 'en'}
                canEditAuthor={canEditAuthorFlag}
                canPublish={can('publish posts')}
                isEditing={true}
                onSubmit={(data) => handlePostSubmit(data, editPost?.id)}
                onCancel={() => router.visit(ROUTE.posts.index())}
                onLocaleChange={handleLocaleChange}
            />
        </SectionWrapper>
    );

    const renderPostShow = () => (
        <SectionWrapper
            title={t('dashboard.posts.show_title', { type: postTypeSingular })}
            description={t('dashboard.posts.show_description', { type: postTypeSingular.toLowerCase() })}
            actions={
                <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
                    {t('dashboard.posts.actions.back', { type: postTypeName })}
                </Button>
            }
        >
            {(post || editPost) && <PostView post={(post || editPost)!} />}
        </SectionWrapper>
    );

    return {
        posts: renderPostsList,
        'posts.create': renderPostCreate,
        'posts.edit': renderPostEdit,
        'posts.show': renderPostShow,
    };
}
