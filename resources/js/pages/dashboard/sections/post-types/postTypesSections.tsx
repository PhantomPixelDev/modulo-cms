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
}: {
  postTypes: any;
  editPostType: any;
  globalCommentsEnabled: boolean;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const handleDeletePostType = async (pt: any) => {
    const name = pt?.label || pt?.name || 'this post type';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await router.delete(ROUTE.postTypes.destroy(pt.id), {
        onSuccess: () => {
          showSuccess('Post type deleted');
          router.visit(ROUTE.postTypes.index());
        },
        onError: () => showError('Failed to delete post type'),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting post type:', error);
      showError('An error occurred while deleting the post type');
    }
  };

  const handlePostTypeSubmit = async (formData: any) => {
    try {
      const url = (editPostType as any) ? ROUTE.postTypes.update((editPostType as any).id) : ROUTE.postTypes.store();
      const method = (editPostType as any) ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Post type ${(editPostType as any) ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.postTypes.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${(editPostType as any) ? 'update' : 'create'} post type`);
        },
      });
    } catch (error) {
      console.error('Error saving post type:', error);
      showError(`Failed to ${(editPostType as any) ? 'update' : 'create'} post type`);
    }
  };

  const renderPostTypesList = () => (
    <SectionWrapper
      title="Post Types"
      actions={
        can('create post types') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.postTypes.create())}>
            + New Post Type
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
      title={'Create Post Type'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.postTypes.index())}>
          Back to Post Types
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
      title={'Edit Post Type'}
      actions={
        <div className="flex gap-2">
          {can('delete post types') && (
            <Button variant="destructive" size="sm" onClick={() => handleDeletePostType(editPostType)}>
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.postTypes.index())}>
            Back to Post Types
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
