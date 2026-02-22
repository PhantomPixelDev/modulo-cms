import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PostTypeForm } from '../../components/post-types/PostTypeForm';
import { PostTypeList } from '../../components/post-types/PostTypeList';
import { asArray } from '../../types';

export function getPostTypesSections({
  postTypes,
  editPostType,
  globalCommentsEnabled,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  postTypes: any;
  editPostType: any;
  globalCommentsEnabled: boolean;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const handleDeletePostType = async (pt: any) => {
    const name = pt?.label || pt?.name || t('dashboard.common.item');
    if (!window.confirm(t('dashboard.post_types.confirm_delete', { name }))) return;
    try {
      await router.delete(ROUTE.postTypes.destroy(pt.id), {
        onSuccess: () => {
          showSuccess(t('dashboard.post_types.messages.deleted'));
          router.visit(ROUTE.postTypes.index());
        },
        onError: () => showError(t('dashboard.post_types.messages.delete_failed')),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting post type:', error);
      showError(t('dashboard.post_types.messages.delete_error'));
    }
  };

  const handlePostTypeSubmit = async (formData: any) => {
    try {
      const url = (editPostType as any) ? ROUTE.postTypes.update((editPostType as any).id) : ROUTE.postTypes.store();
      const method = (editPostType as any) ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(
            t(
              (editPostType as any)
                ? 'dashboard.post_types.messages.updated'
                : 'dashboard.post_types.messages.created'
            )
          );
          router.visit(ROUTE.postTypes.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(
            t(
              (editPostType as any)
                ? 'dashboard.post_types.messages.update_failed'
                : 'dashboard.post_types.messages.create_failed'
            )
          );
        },
      });
    } catch (error) {
      console.error('Error saving post type:', error);
      showError(
        t(
          (editPostType as any)
            ? 'dashboard.post_types.messages.update_failed'
            : 'dashboard.post_types.messages.create_failed'
        )
      );
    }
  };

  const renderPostTypesList = () => (
    <SectionWrapper
      title={t('dashboard.post_types.title')}
      description={t('dashboard.post_types.description')}
      actions={
        can('create post types') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.postTypes.create())}>
            {t('dashboard.post_types.actions.new')}
          </Button>
        ) : null
      }
    >
      <PostTypeList
        items={asArray(postTypes).map((pt: any) => ({
          id: pt.id,
          name: pt.name,
          label: pt.label,
          route_prefix: pt.route_prefix ?? null,
        }))}
        canView={can('view post types')}
        canEdit={can('edit post types')}
        canDelete={can('delete post types')}
        onView={(id) => router.visit(ROUTE.postTypes.show(id))}
        onEdit={(id) => router.visit(ROUTE.postTypes.edit(id))}
        onDelete={(pt) => handleDeletePostType(pt)}
      />
    </SectionWrapper>
  );

  const renderPostTypeCreate = () => (
    <SectionWrapper
      title={t('dashboard.post_types.create_title')}
      description={t('dashboard.post_types.create_description')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.postTypes.index())}>
          {t('dashboard.post_types.actions.back')}
        </Button>
      }
    >
      <PostTypeForm
        isEditing={false}
        globalCommentsEnabled={globalCommentsEnabled}
        onSubmit={handlePostTypeSubmit}
        onCancel={() => router.visit(ROUTE.postTypes.index())}
      />
    </SectionWrapper>
  );

  const renderPostTypeEdit = () => (
    <SectionWrapper
      title={t('dashboard.post_types.edit_title')}
      description={t('dashboard.post_types.edit_description')}
      actions={
        <div className="flex gap-2">
          {can('delete post types') && (
            <Button variant="destructive" size="sm" onClick={() => handleDeletePostType(editPostType)}>
              {t('dashboard.post_types.actions.delete')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.postTypes.index())}>
            {t('dashboard.post_types.actions.back')}
          </Button>
        </div>
      }
    >
      <PostTypeForm
        postType={editPostType as any}
        isEditing={true}
        globalCommentsEnabled={globalCommentsEnabled}
        onSubmit={handlePostTypeSubmit}
        onCancel={() => router.visit(ROUTE.postTypes.index())}
      />
    </SectionWrapper>
  );

  return {
    'post-types': renderPostTypesList,
    'post-types.create': renderPostTypeCreate,
    'post-types.edit': renderPostTypeEdit,
  };
}
