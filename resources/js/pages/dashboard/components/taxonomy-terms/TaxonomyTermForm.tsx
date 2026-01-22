import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export type TaxonomyDTO = {
  id: number;
  name: string;
  label: string;
  slug: string;
};

export type TaxonomyTermDTO = {
  id: number;
  taxonomy_id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  term_order?: number;
  meta_title?: string | null;
  meta_description?: string | null;
};

export function TaxonomyTermForm({
  term,
  taxonomies,
  parentTerms,
  isEditing,
  onSubmit,
  onCancel,
  canDelete = false,
  onDelete,
}: {
  term?: Partial<TaxonomyTermDTO> | null;
  taxonomies: TaxonomyDTO[];
  parentTerms: Array<{ id: number; name: string }>;
  isEditing: boolean;
  onSubmit: (payload: any) => void;
  onCancel: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const firstTaxonomyId = taxonomies?.[0]?.id ?? null;
  const { data, setData, processing, errors, reset } = useForm({
    taxonomy_id: (term?.taxonomy_id ?? firstTaxonomyId) as any,
    name: term?.name ?? '',
    description: term?.description ?? '',
    parent_id: (term?.parent_id ?? null) as any,
    term_order: Number(term?.term_order ?? 0),
    meta_title: (term as any)?.meta_title ?? '',
    meta_description: (term as any)?.meta_description ?? '',
  });

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const filteredParents = parentTerms || [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(data);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Taxonomy</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={data.taxonomy_id ?? ''}
            onChange={(e) => setData('taxonomy_id', Number(e.target.value) || null)}
          >
            {(taxonomies || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.taxonomy_id && <p className="text-xs text-red-500">{errors.taxonomy_id as any}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order</label>
          <Input
            type="number"
            value={data.term_order}
            onChange={(e) => setData('term_order', Number(e.target.value))}
          />
          {errors.term_order && <p className="text-xs text-red-500">{errors.term_order as any}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
        <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
        {errors.name && <p className="text-xs text-red-500">{errors.name as any}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parent (optional)</label>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={data.parent_id ?? 0}
          onChange={(e) => setData('parent_id', Number(e.target.value) || null)}
        >
          <option value={0}>— None —</option>
          {filteredParents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
          {errors.parent_id && <p className="text-xs text-red-500">{errors.parent_id as any}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
        <Textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className="min-h-[90px]" />
        {errors.description && <p className="text-xs text-red-500">{errors.description as any}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta Title</label>
          <Input value={data.meta_title} onChange={(e) => setData('meta_title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta Description</label>
          <Input value={data.meta_description} onChange={(e) => setData('meta_description', e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        {isEditing && canDelete && onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} disabled={processing}>
            Delete
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel} disabled={processing}>
          Cancel
        </Button>
        <Button disabled={processing}>{isEditing ? 'Update Term' : 'Create Term'}</Button>
      </div>
    </form>
  );
}
