import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

export type TemplateDTO = {
  id: number;
  name: string;
  slug: string;
  type: string;
  description?: string | null;
  content: string;
  is_default?: boolean;
  is_active?: boolean;
  variables?: string[];
};

export function TemplateForm({
  template,
  templateTypes,
  isEditing,
  onSubmit,
  onCancel,
  canDelete = false,
  onDelete,
}: {
  template?: Partial<TemplateDTO> | null;
  templateTypes: Record<string, string>;
  isEditing: boolean;
  onSubmit: (payload: any) => void;
  onCancel: () => void;
  canDelete?: boolean;
  onDelete?: () => void;
}) {
  const allowedTypes = new Set(['post', 'page', 'partial']);
  const filteredTemplateTypes = Object.fromEntries(
    Object.entries(templateTypes || {}).filter(([key]) => allowedTypes.has(key) || key === template?.type)
  );
  const firstType = (['post', 'page', 'partial'].find((t) => t in filteredTemplateTypes) || Object.keys(filteredTemplateTypes)[0]) ?? '';
  const { data, setData, processing, errors, reset } = useForm({
    name: template?.name ?? '',
    type: template?.type ?? firstType,
    description: template?.description ?? '',
    content: template?.content ?? '',
    is_default: Boolean(template?.is_default ?? false),
    is_active: Boolean(template?.is_active ?? true),
  });

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

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
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</label>
          <Input value={data.name} onChange={(e) => setData('name', e.target.value)} />
          {errors.name && <p className="text-xs text-red-500">{errors.name as any}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={data.type}
            onChange={(e) => setData('type', e.target.value)}
          >
            {Object.entries(filteredTemplateTypes).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-xs text-red-500">{errors.type as any}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</label>
        <Textarea
          value={data.description}
          onChange={(e) => setData('description', e.target.value)}
          className="min-h-[80px]"
        />
        {errors.description && <p className="text-xs text-red-500">{errors.description as any}</p>}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content</label>
        <Textarea
          value={data.content}
          onChange={(e) => setData('content', e.target.value)}
          className="min-h-[220px] font-mono text-sm"
        />
        {errors.content && <p className="text-xs text-red-500">{errors.content as any}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
          <span>Active</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={data.is_default} onChange={(e) => setData('is_default', e.target.checked)} />
          <span>Default for this type</span>
        </label>
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
        <Button disabled={processing}>{isEditing ? 'Update Template' : 'Create Template'}</Button>
      </div>
    </form>
  );
}
