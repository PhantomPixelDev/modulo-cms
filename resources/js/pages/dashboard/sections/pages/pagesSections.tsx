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
  t,
}: {
  postsProp: any;
  post: any;
  editPost: any;
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
          showSuccess(
            t(
              editId
                ? 'dashboard.pages.messages.updated'
                : 'dashboard.pages.messages.created'
            )
          );
          router.visit(ROUTE.pages.index());
        },
        onError: (errors) => {
          console.error('Validation errors:', errors);
          showError(
            t(
              editId
                ? 'dashboard.pages.messages.update_failed'
                : 'dashboard.pages.messages.create_failed'
            )
          );
        },
      });
    } catch (error) {
      console.error('Error saving page:', error);
      showError(
        t(
          editId
            ? 'dashboard.pages.messages.update_failed'
            : 'dashboard.pages.messages.create_failed'
        )
      );
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
      title={t('dashboard.pages.create_title')}
      description={t('dashboard.pages.create_description')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.pages.index())}>
          {t('dashboard.pages.actions.back')}
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
      title={t('dashboard.pages.edit_title')}
      description={t('dashboard.pages.edit_description')}
      actions={
        <div className="flex gap-2">
          {can('delete posts') && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeletePage((post as any) || (editPost as any))}
            >
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
