import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { TaxonomyTermsList } from '../../components/taxonomy-terms/TaxonomyTermsList';
import { TaxonomyTermForm } from '../../components/taxonomy-terms/TaxonomyTermForm';
import { TaxonomyTermView } from '../../components/taxonomy-terms/TaxonomyTermView';
import { asArray } from '../../types';

export function getTaxonomyTermsSections({
  adminSection,
  taxonomyTerms,
  taxonomyTerm,
  editTaxonomyTerm,
  taxonomies,
  parentTerms,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  adminSection?: string;
  taxonomyTerms: any;
  taxonomyTerm: any;
  editTaxonomyTerm: any;
  taxonomies: any;
  parentTerms: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderTaxonomyTermsList = () => {
    const termItems = asArray((taxonomyTerms as any)?.data ?? taxonomyTerms).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      term_order: t.term_order,
      taxonomy: t.taxonomy,
    }));

    return (
      <SectionWrapper
        title={t('dashboard.taxonomy_terms.title')}
        actions={
          can('create taxonomy terms') ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.create())}>
              {t('dashboard.taxonomy_terms.actions.new')}
            </Button>
          ) : null
        }
      >
        <TaxonomyTermsList
          items={termItems as any}
          canView={can('view taxonomy terms')}
          canEdit={can('edit taxonomy terms')}
          canDelete={can('delete taxonomy terms')}
          onView={(id) => router.visit(ROUTE.taxonomyTerms.show(id))}
          onEdit={(id) => router.visit(ROUTE.taxonomyTerms.edit(id))}
          onDelete={(item) => {
            if (!window.confirm(t('dashboard.taxonomy_terms.confirm_delete', { name: item.name }))) return;
            router.delete(ROUTE.taxonomyTerms.destroy(item.id));
          }}
        />
      </SectionWrapper>
    );
  };

  const renderTaxonomyTermCreateEdit = () => {
    const isEditing = adminSection === 'taxonomy-terms.edit';
    const term = isEditing ? (editTaxonomyTerm as any) : null;

    return (
      <SectionWrapper
        title={isEditing ? t('dashboard.taxonomy_terms.edit_title') : t('dashboard.taxonomy_terms.create_title')}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.index())}>
            {t('dashboard.taxonomy_terms.actions.back')}
          </Button>
        }
      >
        <TaxonomyTermForm
          term={term}
          taxonomies={asArray(taxonomies as any) as any}
          parentTerms={asArray(parentTerms as any) as any}
          isEditing={isEditing}
          canDelete={can('delete taxonomy terms')}
          onDelete={() => {
            if (!term?.id) return;
            if (!window.confirm(t('dashboard.taxonomy_terms.confirm_delete', { name: term.name }))) return;
            router.delete(ROUTE.taxonomyTerms.destroy(term.id));
          }}
          onSubmit={(payload) => {
            const method = isEditing ? 'put' : 'post';
            const url = isEditing && term?.id ? ROUTE.taxonomyTerms.update(term.id) : ROUTE.taxonomyTerms.store();
            router[method](url, payload, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(
                  t(
                    isEditing
                      ? 'dashboard.taxonomy_terms.messages.updated'
                      : 'dashboard.taxonomy_terms.messages.created'
                  )
                );
                router.visit(ROUTE.taxonomyTerms.index());
              },
              onError: () => showError(
                t(
                  isEditing
                    ? 'dashboard.taxonomy_terms.messages.update_failed'
                    : 'dashboard.taxonomy_terms.messages.create_failed'
                )
              ),
            });
          }}
          onCancel={() => router.visit(ROUTE.taxonomyTerms.index())}
        />
      </SectionWrapper>
    );
  };

  const renderTaxonomyTermShow = () => (
    <SectionWrapper
      title={t('dashboard.taxonomy_terms.show_title')}
      actions={
        <div className="flex gap-2">
          {can('edit taxonomy terms') && taxonomyTerm?.id ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.edit(taxonomyTerm.id))}>
              {t('dashboard.taxonomy_terms.actions.edit')}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.index())}>
            {t('dashboard.taxonomy_terms.actions.back')}
          </Button>
        </div>
      }
    >
      <TaxonomyTermView term={taxonomyTerm as any} />
    </SectionWrapper>
  );

  return {
    'taxonomy-terms': renderTaxonomyTermsList,
    'taxonomy-terms.create': renderTaxonomyTermCreateEdit,
    'taxonomy-terms.edit': renderTaxonomyTermCreateEdit,
    'taxonomy-terms.show': renderTaxonomyTermShow,
  };
}
