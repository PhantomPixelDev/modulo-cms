import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
// Ziggy exposes a global `route()` when @routes is included; declare it for TS
declare const route: (name: string, params?: any) => string;
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { TaxonomyList } from '../../components/taxonomies/TaxonomyList';
import { TaxonomyForm } from '../../components/taxonomies/TaxonomyForm';
import { asArray } from '../../types';

export function getTaxonomiesSections({
  adminSection,
  taxonomies,
  editTaxonomy,
  postTypes,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  adminSection?: string;
  taxonomies: any;
  editTaxonomy: any;
  postTypes: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderTaxonomiesList = () => (
    <SectionWrapper
      title={t('dashboard.taxonomies.title')}
      description={t('dashboard.taxonomies.description')}
      actions={
        can('create taxonomies') ? (
          <Button size="sm" onClick={() => router.visit(ROUTE.taxonomies.create())}>
            {t('dashboard.taxonomies.actions.new')}
          </Button>
        ) : null
      }
    >
      <TaxonomyList
        items={(Array.isArray((taxonomies as any)?.data) ? (taxonomies as any).data : asArray(taxonomies)).map((tx: any) => ({
          id: tx.id,
          name: tx.name,
          label: tx.label,
        }))}
        canView={can('view taxonomies')}
        canEdit={can('edit taxonomies')}
        onView={(id) => router.visit(ROUTE.taxonomies.show(id))}
        onEdit={(id) => router.visit(ROUTE.taxonomies.edit(id))}
      />
    </SectionWrapper>
  );

  const renderTaxonomyForm = () => (
    <SectionWrapper
      title={
        adminSection === 'taxonomies.create'
          ? t('dashboard.taxonomies.create_title')
          : t('dashboard.taxonomies.edit_title')
      }
      description={
        adminSection === 'taxonomies.create'
          ? t('dashboard.taxonomies.create_description')
          : t('dashboard.taxonomies.edit_description')
      }
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.taxonomies.index())}>
          {t('dashboard.taxonomies.actions.back')}
        </Button>
      }
    >
      <TaxonomyForm
        taxonomy={(adminSection === 'taxonomies.edit' ? editTaxonomy : null) as any}
        postTypes={(postTypes as any) || []}
        isEditing={adminSection === 'taxonomies.edit'}
        onSubmit={async (payload) => {
          const isEditingTaxonomy = adminSection === 'taxonomies.edit' && editTaxonomy;
          try {
            const method = isEditingTaxonomy ? 'put' : 'post';
            const url = isEditingTaxonomy
              ? route('dashboard.admin.taxonomies.update', { taxonomy: editTaxonomy.id })
              : route('dashboard.admin.taxonomies.store');
            await router[method](url, payload, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(
                  t(
                    isEditingTaxonomy
                      ? 'dashboard.taxonomies.messages.updated'
                      : 'dashboard.taxonomies.messages.created'
                  )
                );
                router.visit(ROUTE.taxonomies.index());
              },
              onError: (errors) => {
                console.error('Failed to save taxonomy', errors);
                showError(
                  t(
                    isEditingTaxonomy
                      ? 'dashboard.taxonomies.messages.update_failed'
                      : 'dashboard.taxonomies.messages.create_failed'
                  )
                );
              },
            });
          } catch (error) {
            console.error('Error submitting taxonomy form:', error);
            showError(
              t(
                isEditingTaxonomy
                  ? 'dashboard.taxonomies.messages.update_failed'
                  : 'dashboard.taxonomies.messages.create_failed'
              )
            );
          }
        }}
        onCancel={() => router.visit(ROUTE.taxonomies.index())}
      />
    </SectionWrapper>
  );

  return {
    taxonomies: renderTaxonomiesList,
    'taxonomies.create': renderTaxonomyForm,
    'taxonomies.edit': renderTaxonomyForm,
  };
}
