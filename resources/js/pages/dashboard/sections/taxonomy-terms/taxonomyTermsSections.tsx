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
        title="Taxonomy Terms"
        actions={
          can('create taxonomy terms') ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.create())}>
              + New Term
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
            if (!window.confirm(`Delete term "${item.name}"? This cannot be undone.`)) return;
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
        title={isEditing ? 'Edit Taxonomy Term' : 'Create Taxonomy Term'}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.index())}>
            Back to Terms
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
            if (!window.confirm(`Delete term "${term.name}"? This cannot be undone.`)) return;
            router.delete(ROUTE.taxonomyTerms.destroy(term.id));
          }}
          onSubmit={(payload) => {
            const method = isEditing ? 'put' : 'post';
            const url = isEditing && term?.id ? ROUTE.taxonomyTerms.update(term.id) : ROUTE.taxonomyTerms.store();
            router[method](url, payload, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(`Term ${isEditing ? 'updated' : 'created'} successfully`);
                router.visit(ROUTE.taxonomyTerms.index());
              },
              onError: () => showError(`Failed to ${isEditing ? 'update' : 'create'} term`),
            });
          }}
          onCancel={() => router.visit(ROUTE.taxonomyTerms.index())}
        />
      </SectionWrapper>
    );
  };

  const renderTaxonomyTermShow = () => (
    <SectionWrapper
      title="Taxonomy Term"
      actions={
        <div className="flex gap-2">
          {can('edit taxonomy terms') && taxonomyTerm?.id ? (
            <Button size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.edit(taxonomyTerm.id))}>
              Edit
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.taxonomyTerms.index())}>
            Back to Terms
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
