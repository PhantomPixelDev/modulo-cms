import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ROUTE } from '../../routes';
import type { MediaItem, MediaFolder, Paginated } from '../../types';

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
  initialFolderId?: number | null;
  type?: '' | 'image' | 'video' | 'audio' | 'doc' | 'other';
}

export const MediaPickerDialog: React.FC<MediaPickerDialogProps> = ({ open, onOpenChange, onSelect, initialFolderId = null, type = 'image' }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState<Pick<Paginated<MediaItem>, 'current_page' | 'last_page' | 'per_page' | 'total'>>({ current_page: 1, last_page: 1, per_page: 24, total: 0 });
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<MediaFolder[]>([]);
  const [folderId, setFolderId] = useState<number | null>(initialFolderId ?? null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    // reset to initial folder on open
    setFolderId(initialFolderId ?? null);
    setQ('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const load = async (page?: number) => {
    setLoading(true);
    try {
      const url = ROUTE.media.index({ folder_id: folderId ?? undefined, q: q || undefined, type: type || undefined, page: page || undefined, perPage: pagination.per_page });
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      const media = data.media;
      const arr: MediaItem[] = Array.isArray(media) ? media : (media?.data || []);
      setItems(arr);
      if (!Array.isArray(media)) {
        setPagination({ current_page: media.current_page, last_page: media.last_page, per_page: media.per_page, total: media.total });
      } else {
        setPagination({ current_page: 1, last_page: 1, per_page: 24, total: arr.length });
      }
      setFolders(Array.isArray(data.folders) ? data.folders : []);
      setBreadcrumb(Array.isArray(data.breadcrumb) ? data.breadcrumb : []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, folderId]);

  const canPrev = pagination.current_page > 1;
  const canNext = pagination.current_page < pagination.last_page;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Select media</DialogTitle>
          <DialogDescription>Pick an item from the media library.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 && (
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1">
              {breadcrumb.map((b, idx) => (
                <span key={b.id} className="flex items-center gap-1">
                  <button type="button" className="underline hover:no-underline" onClick={() => setFolderId(b.id)}>
                    {b.name}
                  </button>
                  {idx < breadcrumb.length - 1 && <span>/</span>}
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="border rounded px-2 py-1 text-sm w-full"
            />
            <Button size="sm" variant="secondary" onClick={() => load(1)} disabled={loading}>Search</Button>
          </div>

          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((f) => (
                <button key={f.id} type="button" className="border rounded p-2 flex flex-col gap-2 text-left hover:bg-muted/30" onClick={() => setFolderId(f.id)}>
                  <div className="aspect-square bg-amber-100 text-amber-800 flex items-center justify-center overflow-hidden rounded">
                    <span className="text-3xl">📁</span>
                  </div>
                  <div className="text-xs break-words font-medium">{f.name}</div>
                </button>
              ))}
            </div>
          )}

          {/* Media grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 min-h-24">
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                className="border rounded p-2 flex flex-col gap-2 hover:bg-muted/30"
                title={m.name}
                onClick={() => onSelect(m)}
              >
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumb || m.url} alt={m.custom_properties?.alt || m.name} className="object-cover w-full h-full" />
                </div>
                <div className="text-xs break-words">
                  <div className="font-medium truncate" title={m.name}>{m.name}</div>
                  <div className="text-muted-foreground truncate" title={m.mime_type}>{m.mime_type}</div>
                </div>
              </button>
            ))}
            {items.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground">{loading ? 'Loading…' : 'No media found.'}</div>
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between text-sm">
              <div>Page {pagination.current_page} of {pagination.last_page} • {pagination.total} items</div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={!canPrev} onClick={() => load(pagination.current_page - 1)}>Prev</Button>
                <Button size="sm" variant="outline" disabled={!canNext} onClick={() => load(pagination.current_page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPickerDialog;
