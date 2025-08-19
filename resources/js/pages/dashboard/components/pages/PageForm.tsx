import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PageFormProps {
  page?: any;
  isEditing: boolean;
  onSubmit: (data: any) => Promise<void> | void;
  onCancel: () => void;
}

export function PageForm({ page, isEditing, onSubmit, onCancel }: PageFormProps) {
  const [form, setForm] = useState({
    title: page?.title ?? '',
    slug: page?.slug ?? '',
    status: page?.status ?? 'draft',
    content: page?.content ?? '',
    excerpt: page?.excerpt ?? '',
    featured_image: page?.featured_image ?? '',
    meta_title: page?.meta_title ?? '',
    meta_description: page?.meta_description ?? '',
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Excerpt</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="auto-generated if empty"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Content</label>
        <textarea
          className="w-full border rounded px-3 py-2 min-h-40"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          required
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">{isEditing ? 'Update Page' : 'Create Page'}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
