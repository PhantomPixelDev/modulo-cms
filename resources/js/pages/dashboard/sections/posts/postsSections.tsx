import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PostList } from '../../components/posts/PostList';
import { PostForm } from '../../components/posts/PostForm';
import { PostView } from '../../components/posts/PostView';

export function getPostsSections({
  postsProp,
  editPost,
  post,
  postTypes,
  currentPostType,
  groupedTerms,
  authors,
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
  postsProp: any;
  editPost: any;
  post: any;
  postTypes: any;
  currentPostType?: any;
  groupedTerms: any;
  authors: any;
  parentsByType: any;
  locales?: any[];
  currentLocale?: string;
  translation?: any;
  can: (perm: string) => boolean;
  canEditAuthorFlag: boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  // Get the display name for the current post type
  const postTypeName = currentPostType?.label || currentPostType?.plural_label || t('dashboard.posts.title');
  const postTypeSingular = currentPostType?.label || currentPostType?.name || t('dashboard.posts.view_post');
  const handlePostSubmit = async (formData: any, editId?: number) => {
    try {
      const url = editId ? ROUTE.posts.update(editId) : ROUTE.posts.store();
      const method = editId ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(
            t(
              editId
                ? 'dashboard.posts.messages.updated'
                : 'dashboard.posts.messages.created'
            )
          );
          router.visit(ROUTE.posts.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(
            t(
              editId
                ? 'dashboard.posts.messages.update_failed'
                : 'dashboard.posts.messages.create_failed'
            )
          );
        },
      });
    } catch (error) {
      console.error('Error saving post:', error);
      showError(
        t(
          editId
            ? 'dashboard.posts.messages.update_failed'
            : 'dashboard.posts.messages.create_failed'
        )
      );
    }
  };

  const handleLocaleChange = (locale: string) => {
    const currentUrl = window.location.pathname;
    router.visit(`${currentUrl}?locale=${locale}`);
  };

  const renderPostsList = () => {
    const postItems = Array.isArray(postsProp) ? postsProp : ((postsProp as any)?.data ?? []);

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
        <PostList posts={postItems} locales={locales} canCreate={false} canEdit={can('edit posts')} />
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
        isEditing={false}
        postTypes={(postTypes as any) || []}
        groupedTerms={(groupedTerms as any) || {}}
        authors={(authors as any) || []}
        parentsByType={(parentsByType as any) || {}}
        locales={locales}
        currentLocale={currentLocale || 'en'}
        canEditAuthor={canEditAuthorFlag}
        onSubmit={handlePostSubmit}
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
        post={editPost as any}
        translation={translation}
        postTypes={(postTypes as any) || []}
        groupedTerms={(groupedTerms as any) || {}}
        authors={(authors as any) || []}
        parentsByType={(parentsByType as any) || {}}
        locales={locales}
        currentLocale={currentLocale || 'en'}
        canEditAuthor={canEditAuthorFlag}
        isEditing={true}
        onSubmit={(data) => handlePostSubmit(data, (editPost as any)?.id)}
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
      <PostView post={(post as any) || (editPost as any)} />
    </SectionWrapper>
  );

  return {
    posts: renderPostsList,
    'posts.create': renderPostCreate,
    'posts.edit': renderPostEdit,
    'posts.show': renderPostShow,
  };
}
