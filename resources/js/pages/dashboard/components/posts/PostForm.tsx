import { useMemo, useState } from 'react';
import SlateEditor from './SlateEditor';
import { Button } from '@/components/ui/button';

function toDatetimeLocalStr(s?: string): string {
  if (!s) return '';
  // If already like 2025-01-01T12:30:00 or 2025-01-01T12:30
  if (s.includes('T')) return s.slice(0, 16);
  // If like 2025-01-01 12:30:00
  if (s.includes(' ')) {
    const [d, t] = s.split(' ');
    return `${d}T${t.slice(0, 5)}`;
  }
  return s;
}

interface PostFormProps {
  post?: any;
  postTypes?: Array<{ id: number; name: string; label: string; is_hierarchical?: boolean }>;
  // grouped taxonomy terms keyed by taxonomy name
  groupedTerms?: Record<string, Array<{ id: number; name: string }>>;
  authors?: Array<{ id: number; name: string }>;
  // Map of post_type_id -> array of parent candidates { id, title }
  parentsByType?: Record<string | number, Array<{ id: number; title: string }>>;
  // Only admins (or those with permission) can edit author
  canEditAuthor?: boolean;
  isEditing: boolean;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
}

export function PostForm({ post, postTypes = [], groupedTerms = {}, authors = [], parentsByType = {}, canEditAuthor = false, isEditing, onSubmit, onCancel }: PostFormProps) {
  const initialSelectedTerms: number[] = useMemo(() => {
    if (Array.isArray(post?.selected_terms)) return post.selected_terms as number[];
    if (Array.isArray(post?.taxonomy_terms)) {
      return (post.taxonomy_terms as Array<{ id: number }>).map(t => t.id);
    }
    return [];
  }, [post]);

  const slugify = (value: string) =>
    value
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const [form, setForm] = useState({
    post_type_id: post?.post_type_id ?? post?.post_type?.id ?? postTypes[0]?.id ?? '',
    title: post?.title ?? '',
    slug: post?.slug ?? '',
    status: post?.status ?? 'draft',
    content: post?.content ?? '',
    excerpt: post?.excerpt ?? '',
    featured_image: post?.featured_image ?? '',
    meta_title: post?.meta_title ?? '',
    meta_description: post?.meta_description ?? '',
    taxonomy_terms: initialSelectedTerms,
    // New fields
    published_at: toDatetimeLocalStr(post?.published_at ?? ''),
    author_id: post?.author?.id ?? undefined,
    parent_id: post?.parent_id ?? undefined,
    menu_order: typeof post?.menu_order === 'number' ? post.menu_order : 0,
    meta_data: (post?.meta_data && typeof post.meta_data === 'object') ? post.meta_data : {},
  });

  // Meta data repeater hook
  const { metaPairs, setMetaPairs, updateMetaPair, removeMetaPair, toObject } = useMetaPairs(form.meta_data || {});

  // Slate will emit HTML to keep form.content in sync

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    // Ensure numeric types where needed
    payload.post_type_id = Number(payload.post_type_id);
    if (payload.author_id) payload.author_id = Number(payload.author_id);
    if (payload.parent_id) payload.parent_id = Number(payload.parent_id);
    payload.menu_order = Number(payload.menu_order || 0);
    payload.meta_data = toObject();
    await onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Basics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
                // If slug is empty, keep it derived from title as user types
                slug: f.slug ? f.slug : slugify(title),
              }));
            }}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Post Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.post_type_id}
            onChange={(e) => setForm((f) => ({ ...f, post_type_id: Number(e.target.value) }))}
            required
          >
            {postTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>{pt.label || pt.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <div className="flex gap-2">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              onBlur={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value || f.title) }))}
              placeholder="auto-generated from title"
            />
            <Button type="button" variant="outline" onClick={() => setForm((f) => ({ ...f, slug: slugify(f.title) }))}>Generate</Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate from title.</p>
        </div>
        <div>
          <label className="block text-sm mb-1">Featured Image URL</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.featured_image}
            onChange={(e) => setForm((f) => ({ ...f, featured_image: e.target.value }))}
            placeholder="https://..."
          />
          {form.featured_image ? (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.featured_image} alt="Featured" className="max-h-32 rounded border" />
            </div>
          ) : null}
        </div>
      </div>

      {/* Status and Excerpt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Status</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="private">Private</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Excerpt</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          />
        </div>
      </div>

      {/* Scheduling and Author */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Published At</label>
          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2"
            value={form.published_at || ''}
            onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground mt-1">Optional: set to schedule publication time.</p>
        </div>
        {canEditAuthor && (
          <div>
            <label className="block text-sm mb-1">Author</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={form.author_id ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, author_id: e.target.value ? Number(e.target.value) : undefined }))}
            >
              <option value="">— Keep Current —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hierarchical options: Parent and Menu Order */}
      {(() => {
        const currentPT = postTypes.find(pt => Number(pt.id) === Number(form.post_type_id));
        if (!currentPT?.is_hierarchical) return null;
        const parentOptions = parentsByType?.[String(form.post_type_id)] || parentsByType?.[Number(form.post_type_id)] || [];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Parent</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={form.parent_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value ? Number(e.target.value) : undefined }))}
              >
                <option value="">— None —</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Menu Order</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={form.menu_order}
                onChange={(e) => setForm((f) => ({ ...f, menu_order: Number(e.target.value || 0) }))}
              />
            </div>
          </div>
        );
      })()}

      {/* Taxonomy Terms */}
      {groupedTerms && Object.keys(groupedTerms).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedTerms).map(([taxonomyName, terms]) => (
            <fieldset key={taxonomyName} className="border rounded p-3">
              <legend className="text-sm font-medium px-1">{taxonomyName}</legend>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(terms || []).map((term: any) => {
                  const checked = form.taxonomy_terms.includes(term.id);
                  return (
                    <label key={term.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setForm((f) => ({
                            ...f,
                            taxonomy_terms: isChecked
                              ? Array.from(new Set([...(f.taxonomy_terms || []), term.id]))
                              : (f.taxonomy_terms || []).filter((id: number) => id !== term.id),
                          }));
                        }}
                      />
                      <span>{term.name}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      <div>
        <label className="block text-sm mb-2">Content</label>
        <div className="w-full border rounded px-3 py-2 min-h-40 bg-background">
          <SlateEditor
            initialHTML={form.content}
            onHTMLChange={(html) => setForm((f) => ({ ...f, content: html }))}
          />
        </div>
        <textarea className="hidden" readOnly value={form.content} />
      </div>

      {/* Meta fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Meta Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.meta_title}
            onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Meta Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-20"
            value={form.meta_description}
            onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
          />
        </div>
      </div>

      {/* Meta Data Repeater */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Custom Fields</label>
          <Button type="button" variant="outline" size="sm" onClick={() => {
            setMetaPairs((pairs) => [...pairs, { key: '', value: '' }]);
          }}>+ Add Field</Button>
        </div>
        <p className="text-xs text-muted-foreground">Store arbitrary key-value data. Common keys: canonical_url, redirect_url, comments_enabled.</p>
        <div className="space-y-2">
          {metaPairs.map((pair, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <input
                className="col-span-4 border rounded px-3 py-2"
                placeholder="key"
                value={pair.key}
                onChange={(e) => updateMetaPair(idx, { ...pair, key: e.target.value })}
              />
              <input
                className="col-span-7 border rounded px-3 py-2"
                placeholder="value"
                value={pair.value}
                onChange={(e) => updateMetaPair(idx, { ...pair, value: e.target.value })}
              />
              <Button type="button" variant="destructive" className="col-span-1" onClick={() => removeMetaPair(idx)}>✕</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEditing ? 'Update Post' : 'Create Post'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// Helper state and handlers for meta_data key-value pairs
function useMetaPairs(initialObj: Record<string, any>) {
  const [metaPairs, setMetaPairs] = useState<Array<{ key: string; value: string }>>(() => {
    const entries = Object.entries(initialObj || {});
    return entries.length ? entries.map(([k, v]) => ({ key: k, value: String(v) })) : [];
  });
  const updateMetaPair = (index: number, next: { key: string; value: string }) => {
    setMetaPairs((pairs) => pairs.map((p, i) => (i === index ? next : p)));
  };
  const removeMetaPair = (index: number) => {
    setMetaPairs((pairs) => pairs.filter((_, i) => i !== index));
  };
  const toObject = () => metaPairs.reduce((acc, { key, value }) => {
    if (!key) return acc;
    (acc as any)[key] = value;
    return acc;
  }, {} as Record<string, any>);
  return { metaPairs, setMetaPairs, updateMetaPair, removeMetaPair, toObject };
}
