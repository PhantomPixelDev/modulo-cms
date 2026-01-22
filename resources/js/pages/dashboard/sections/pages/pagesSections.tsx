import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PageForm } from '../../components/pages/PageForm';
import { PagesList } from '../../components/pages/PagesList';
import { asArray } from '../../types';

export function getPagesSections({
  postsProp,
  post,
  editPost,
  can,
  showSuccess,
  showError,
  ROUTE,
}: {
  postsProp: any;
  post: any;
  editPost: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const handlePageSubmit = async (formData: any, editId?: number) => {
    const url = editId ? ROUTE.pages.update(editId) : ROUTE.pages.store();
    const method = editId ? 'put' : 'post';
    try {
      router[method](url, formData, {
        preserveScroll: true,
        onSuccess: () => {
          showSuccess(`Page ${editId ? 'updated' : 'created'} successfully`);
          router.visit(ROUTE.pages.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(`Failed to ${editId ? 'update' : 'create'} page`);
        },
      });
    } catch (error) {
      console.error('Error saving page:', error);
      showError(`Failed to ${editId ? 'update' : 'create'} page`);
    }
  };

  const handleDeletePage = async (page: any) => {
    const name = page?.title || 'this page';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await router.delete(ROUTE.pages.destroy(page.id), {
        onSuccess: () => {
          showSuccess('Page deleted');
          router.visit(ROUTE.pages.index());
        },
        onError: () => showError('Failed to delete page'),
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Error deleting page:', error);
      showError('An error occurred while deleting the page');
    }
  };

  const renderPagesList = () => (
    <SectionWrapper
      title="Pages"
      actions={
        can('create posts') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.pages.create())}>
            + New Page
          </Button>
        ) : null
      }
    >
      <PagesList
        pages={asArray((postsProp as any)?.data || [])
          .filter((p: any) => (p.post_type?.name ? p.post_type.name === 'page' : true))
          .map((p: any) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            created_at: p.created_at,
            author: p.author ? { name: p.author.name } : undefined,
          }))}
        canEdit={can('edit posts')}
        canDelete={can('delete posts')}
        onEdit={(id) => router.visit(ROUTE.pages.edit(id))}
        onDelete={(pg) => handleDeletePage(pg)}
      />
    </SectionWrapper>
  );

  const renderPageCreate = () => (
    <SectionWrapper
      title={'Create Page'}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
          Back to Pages
        </Button>
      }
    >
      <PageForm
        isEditing={false}
        onSubmit={(data) => handlePageSubmit(data)}
        onCancel={() => router.visit(ROUTE.pages.index())}
      />
    </SectionWrapper>
  );

  const renderPageEdit = () => (
    <SectionWrapper
      title={'Edit Page'}
      actions={
        <div className="flex gap-2">
          {can('delete posts') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeletePage((post as any) || (editPost as any))}
            >
              Delete
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
            Back to Pages
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
