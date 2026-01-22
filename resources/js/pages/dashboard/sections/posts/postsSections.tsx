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
  groupedTerms,
  authors,
  parentsByType,
  can,
  canEditAuthorFlag,
  showSuccess,
  showError,
  ROUTE,
}: {
  postsProp: any;
  editPost: any;
  post: any;
  postTypes: any;
  groupedTerms: any;
  authors: any;
  parentsByType: any;
  can: (perm: string) => boolean;
  canEditAuthorFlag: boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const handlePostSubmit = async (formData: any, editId?: number) => {
    try {
      const url = editId ? ROUTE.posts.update(editId) : ROUTE.posts.store();
      const method = editId ? 'put' : 'post';
      await router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Post ${editId ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.posts.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${editId ? 'update' : 'create'} post`);
        },
      });
    } catch (error) {
      console.error('Error saving post:', error);
      showError(`Failed to ${editId ? 'update' : 'create'} post`);
    }
  };

  const renderPostsList = () => {
    const postItems = Array.isArray(postsProp) ? postsProp : ((postsProp as any)?.data ?? []);

    return (
      <SectionWrapper
        title="Posts"
        actions={
          can('create posts') ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.posts.create())}>
              + New Post
            </Button>
          ) : null
        }
      >
        <PostList posts={postItems} canCreate={false} canEdit={can('edit posts')} />
      </SectionWrapper>
    );
  };

  const renderPostCreate = () => (
    <SectionWrapper
      title="Create Post"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
          Back to Posts
        </Button>
      }
    >
      <PostForm
        isEditing={false}
        postTypes={(postTypes as any) || []}
        groupedTerms={(groupedTerms as any) || {}}
        authors={(authors as any) || []}
        parentsByType={(parentsByType as any) || {}}
        canEditAuthor={canEditAuthorFlag}
        onSubmit={handlePostSubmit}
        onCancel={() => router.visit(ROUTE.posts.index())}
      />
    </SectionWrapper>
  );

  const renderPostEdit = () => (
    <SectionWrapper
      title="Edit Post"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
          Back to Posts
        </Button>
      }
    >
      <PostForm
        post={editPost as any}
        postTypes={(postTypes as any) || []}
        groupedTerms={(groupedTerms as any) || {}}
        authors={(authors as any) || []}
        parentsByType={(parentsByType as any) || {}}
        canEditAuthor={canEditAuthorFlag}
        isEditing={true}
        onSubmit={(data) => handlePostSubmit(data, (editPost as any)?.id)}
        onCancel={() => router.visit(ROUTE.posts.index())}
      />
    </SectionWrapper>
  );

  const renderPostShow = () => (
    <SectionWrapper
      title="View Post"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.posts.index())}>
          Back to Posts
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
