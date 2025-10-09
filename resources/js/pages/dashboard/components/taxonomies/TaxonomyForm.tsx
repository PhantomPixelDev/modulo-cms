import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import type { PostType, Taxonomy } from '../../types';

export interface TaxonomyFormProps {
  taxonomy?: Partial<Taxonomy> | null;
  postTypes?: PostType[];
  isEditing?: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  label: string;
  plural_label: string;
  description: string;
  slug: string;
  is_hierarchical: boolean;
  is_public: boolean;
  show_in_menu: boolean;
  menu_icon: string;
  menu_position: number | string;
  post_types: Array<string | number>;
}

const createInitialState = (taxonomy?: Partial<Taxonomy> | null): FormState => ({
  name: taxonomy?.name ?? '',
  label: taxonomy?.label ?? '',
  plural_label: taxonomy?.plural_label ?? '',
  description: taxonomy?.description ?? '',
  slug: taxonomy?.slug ?? '',
  is_hierarchical: taxonomy?.is_hierarchical ?? false,
  is_public: taxonomy?.is_public ?? true,
  show_in_menu: taxonomy?.show_in_menu ?? true,
  menu_icon: taxonomy?.menu_icon ?? '',
  menu_position: taxonomy?.menu_position ?? 5,
  post_types: Array.isArray(taxonomy?.post_types)
    ? taxonomy!.post_types
    : [],
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export function TaxonomyForm({ taxonomy, postTypes = [], isEditing = false, onSubmit, onCancel }: TaxonomyFormProps) {
  const [form, setForm] = useState<FormState>(() => createInitialState(taxonomy));
  const [slugDirty, setSlugDirty] = useState(Boolean(taxonomy?.slug));

  useEffect(() => {
    setForm(createInitialState(taxonomy));
    setSlugDirty(Boolean(taxonomy?.slug));
  }, [taxonomy?.id]);

  useEffect(() => {
    if (!slugDirty) {
      const seed = form.label || form.name;
      setForm(prev => ({ ...prev, slug: seed ? slugify(seed) : '' }));
    }
  }, [form.label, form.name, slugDirty]);

  const postTypeOptions = useMemo(() => {
    return Array.isArray(postTypes) ? postTypes : [];
  }, [postTypes]);

  const togglePostType = (identifier: string | number, checked: boolean) => {
    setForm(prev => {
      const next = new Set(prev.post_types.map(String));
      if (checked) {
        next.add(String(identifier));
      } else {
        next.delete(String(identifier));
      }
      return { ...prev, post_types: Array.from(next) };
    });
  };

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...form,
      slug: form.slug?.trim() || slugify(form.label || form.name),
      menu_position: typeof form.menu_position === 'string' ? Number(form.menu_position) || 0 : form.menu_position,
      post_types: form.post_types.map(value => (Number.isNaN(Number(value)) ? value : Number(value))),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="border border-border/60 shadow-none rounded-md">
        <CardContent className="grid gap-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="taxonomy-name">System Name</Label>
              <Input
                id="taxonomy-name"
                required
                value={form.name}
                onChange={event => handleChange('name', event.target.value)}
                placeholder="e.g. category"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxonomy-label">Label (Singular)</Label>
              <Input
                id="taxonomy-label"
                required
                value={form.label}
                onChange={event => handleChange('label', event.target.value)}
                placeholder="e.g. Category"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxonomy-plural-label">Label (Plural)</Label>
              <Input
                id="taxonomy-plural-label"
                required
                value={form.plural_label}
                onChange={event => handleChange('plural_label', event.target.value)}
                placeholder="e.g. Categories"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="taxonomy-slug">Slug</Label>
              <Input
                id="taxonomy-slug"
                required
                value={form.slug}
                onChange={event => {
                  setSlugDirty(true);
                  handleChange('slug', slugify(event.target.value));
                }}
                placeholder="e.g. categories"
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="taxonomy-description">Description</Label>
              <Textarea
                id="taxonomy-description"
                value={form.description}
                onChange={event => handleChange('description', event.target.value)}
                placeholder="Optional description"
                className="min-h-[90px]"
              />
            </div>
          </div>

          <Separator className="my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-muted-foreground">Behaviour</div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_public}
                  onCheckedChange={checked => handleChange('is_public', Boolean(checked))}
                />
                <span>Public</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_hierarchical}
                  onCheckedChange={checked => handleChange('is_hierarchical', Boolean(checked))}
                />
                <span>Hierarchical</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.show_in_menu}
                  onCheckedChange={checked => handleChange('show_in_menu', Boolean(checked))}
                />
                <span>Show in Admin Menu</span>
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-muted-foreground">Menu Settings</div>
              <div className="space-y-1.5">
                <Label htmlFor="taxonomy-menu-icon">Menu Icon</Label>
                <Input
                  id="taxonomy-menu-icon"
                  value={form.menu_icon}
                  onChange={event => handleChange('menu_icon', event.target.value)}
                  placeholder="Optional icon class"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxonomy-menu-position">Menu Position</Label>
                <Input
                  id="taxonomy-menu-position"
                  type="number"
                  value={form.menu_position}
                  onChange={event => handleChange('menu_position', event.target.value)}
                  min={0}
                />
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Attach to Post Types</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {postTypeOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No post types available.</p>
              ) : (
                postTypeOptions.map(pt => {
                  const identifier = pt.slug ?? pt.id;
                  const checked = form.post_types.map(String).includes(String(identifier));
                  return (
                    <label key={pt.id} className="flex items-center gap-2 rounded border border-border/60 bg-muted/30 px-3 py-2 text-sm">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={value => togglePostType(identifier, Boolean(value))}
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="font-medium text-foreground/90">{pt.label}</span>
                        <span className="text-xs text-muted-foreground">{pt.name}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Update Taxonomy' : 'Create Taxonomy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default TaxonomyForm;
