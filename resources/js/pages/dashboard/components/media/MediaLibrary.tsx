import React, { useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ROUTE } from '../../routes';
import type { MediaItem, MediaFolder, Paginated } from '../../types';

interface Props {
  items: MediaItem[];
  pagination?: Pick<Paginated<MediaItem>, 'current_page' | 'last_page' | 'per_page' | 'total'>;
  folders?: MediaFolder[];
  allFolders?: MediaFolder[];
  breadcrumb?: MediaFolder[];
  currentFolderId?: number | null;
  canUpload: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const MediaLibrary: React.FC<Props> = ({ items, pagination, folders = [], allFolders = [], breadcrumb = [], currentFolderId = null, canUpload, canEdit = true, canDelete = true }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [perPage, setPerPage] = useState<number>(pagination?.per_page || 24);
  const [dragActive, setDragActive] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  // Move dialog state
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<number | null>(null);
  const [moveFilter, setMoveFilter] = useState('');

  const filteredAllFolders = useMemo(() => {
    const term = moveFilter.trim().toLowerCase();
    const list = Array.isArray(allFolders) ? allFolders : [];
    if (!term) return list;
    return list.filter((f) =>
      (f.name && f.name.toLowerCase().includes(term)) || (f.path && f.path.toLowerCase().includes(term))
    );
  }, [allFolders, moveFilter]);

  const uploadFiles = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadTotal(files.length);
    setUploadCount(0);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) formData.append('folder_id', String(currentFolderId));
        // eslint-disable-next-line no-await-in-loop
        await router.post(ROUTE.media.store(), formData, { forceFormData: true, preserveScroll: true });
        setUploadCount((c) => c + 1);
      }
      router.reload({ only: ['media', 'folders', 'breadcrumb', 'currentFolderId'] });
    } finally {
      setUploading(false);
      setUploadCount(0);
      setUploadTotal(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onFileInputChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) await uploadFiles(files);
  };

  // Native drag-and-drop support
  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Ignore drags that originate from within this page (e.g., dragging an existing thumbnail)
    try {
      const uriList = e.dataTransfer.getData('text/uri-list');
      if (uriList && typeof window !== 'undefined' && uriList.includes(window.location.origin)) {
        return;
      }
    } catch (_) { /* no-op */ }

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;
    await uploadFiles(files);
    setDragActive(false);
  };
  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    try {
      setCreating(true);
      await router.post(ROUTE.media.folders.store(), { name, parent_id: currentFolderId ?? null }, {
        preserveScroll: true,
        onSuccess: () => {
          setNewFolderName('');
          router.visit(ROUTE.media.index({ folder_id: currentFolderId ?? undefined }));
        },
      });
    } finally {
      setCreating(false);
    }
  };

  const navigateToFolder = (id?: number) => {
    router.visit(ROUTE.media.index({ folder_id: id }));
  };

  const allSelected = useMemo(() => selected.size > 0 && items.every(i => selected.has(i.id)), [items, selected]);
  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };
  const toggleOne = (id: number) => {
    const s = new Set(selected);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelected(s);
  };

  const doSearch = () => {
    router.visit(ROUTE.media.index({ folder_id: currentFolderId ?? undefined, q, type, sort, dir, perPage, page: 1 }));
  };

  const doBulk = async (action: 'delete' | 'regenerate') => {
    if (selected.size === 0) return;
    let payload: Record<string, any> = { action, ids: Array.from(selected) };
    if (action === 'delete' && !confirm(`Delete ${selected.size} item(s)? This cannot be undone.`)) return;
    await router.post(ROUTE.media.bulk(), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setSelected(new Set());
        router.reload({ only: ['media', 'folders', 'breadcrumb', 'currentFolderId'] });
      },
    });
  };

  const submitMove = async () => {
    if (selected.size === 0 || !moveTargetId) return;
    const payload: Record<string, any> = {
      action: 'move',
      ids: Array.from(selected),
      target_folder_id: moveTargetId,
    };
    await router.post(ROUTE.media.bulk(), payload, {
      preserveScroll: true,
      onSuccess: () => {
        setSelected(new Set());
        setMoveOpen(false);
        setMoveTargetId(null);
        setMoveFilter('');
        router.reload({ only: ['media', 'folders', 'breadcrumb', 'currentFolderId'] });
      },
    });
  };

  return (
    <div className="space-y-4" onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}>
      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-1">
          {breadcrumb.map((b, idx) => (
            <span key={b.id} className="flex items-center gap-1">
              <button
                type="button"
                className="underline hover:no-underline"
                onClick={() => navigateToFolder(b.id)}
              >
                {b.name}
              </button>
              {idx < breadcrumb.length - 1 && <span>/</span>}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {canUpload && (
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileRef}
              className="hidden"
              multiple
              onChange={onFileInputChange}
            />
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading && uploadTotal > 0 ? `Uploading ${uploadCount}/${uploadTotal}…` : 'Select files…'}
            </Button>
            <span className="text-xs text-muted-foreground hidden sm:inline">or drag & drop into the area below</span>
          </div>
        )}

        {/* New Folder */}
        {canUpload && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="border rounded px-2 py-1 text-sm"
              placeholder="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={onCreateFolder} disabled={creating || !newFolderName.trim()}>
              {creating ? 'Creating…' : 'New Folder'}
            </Button>
          </div>
        )}

        {/* Search & Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="border rounded px-2 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="doc">Documents</option>
            <option value="other">Other</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="type">Type</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={dir} onChange={(e) => setDir(e.target.value as any)}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select className="border rounded px-2 py-1 text-sm" value={String(perPage)} onChange={(e) => setPerPage(Number(e.target.value))}>
            {[12, 24, 48, 96].map(n => (
              <option key={n} value={n}>{n}/page</option>
            ))}
          </select>
          <Button size="sm" variant="secondary" onClick={doSearch}>Apply</Button>
        </div>
      </div>

      {/* Dropzone area */}
      {canUpload && (
        <div
          className={`rounded border-2 border-dashed p-6 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}`}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileRef.current?.click(); } }}
          aria-label="Upload files by clicking or dragging into this area"
        >
          <div className="text-sm">
            <div className="font-medium">Drag & drop files here</div>
            <div className="text-muted-foreground">or click to choose files</div>
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {(canEdit || canDelete) && (
        <div className="flex items-center gap-2">
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
            Select all
          </label>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              {canDelete && (
                <Button size="sm" variant="destructive" onClick={() => doBulk('delete')}>
                  Delete Selected ({selected.size})
                </Button>
              )}
              {canEdit && (
                <>
                  <Button size="sm" onClick={() => doBulk('regenerate')}>Regenerate</Button>
                  <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>Move…</Button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Folders grid */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {folders.map((f) => (
            <button
              key={f.id}
              className="border rounded p-2 flex flex-col gap-2 text-left hover:bg-muted/30"
              onClick={() => navigateToFolder(f.id)}
            >
              <div className="aspect-square bg-amber-100 text-amber-800 flex items-center justify-center overflow-hidden rounded">
                <span className="text-3xl">📁</span>
              </div>
              <div className="text-xs break-words font-medium">{f.name}</div>
            </button>
          ))}
        </div>
      )}

      {/* Media grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((m) => (
          <div key={m.id} className="border rounded p-2 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleOne(m.id)} />
                Select
              </label>
              <div className="flex items-center gap-2">
                <button className="underline" onClick={() => { try { (navigator as any)?.clipboard?.writeText?.(m.url); } catch (_) {} }} title="Copy URL" type="button">Copy URL</button>
                <a className="underline" href={m.url} target="_blank" rel="noreferrer">Open</a>
              </div>
            </div>
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumb || m.url}
                alt={m.custom_properties?.alt || m.name}
                className="object-cover w-full h-full"
                draggable={false}
                onDragStart={(ev) => { ev.preventDefault(); ev.stopPropagation(); }}
              />
            </div>
            <div className="text-xs break-words">
              <div className="font-medium">{m.name}</div>
              <div className="text-muted-foreground">{m.mime_type}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-sm text-muted-foreground">No media yet.</div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between text-sm">
          <div>Page {pagination.current_page} of {pagination.last_page} • {pagination.total} items</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={pagination.current_page <= 1} onClick={() => router.visit(ROUTE.media.index({ folder_id: currentFolderId ?? undefined, q, type, sort, dir, perPage, page: (pagination.current_page - 1) }))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={pagination.current_page >= pagination.last_page} onClick={() => router.visit(ROUTE.media.index({ folder_id: currentFolderId ?? undefined, q, type, sort, dir, perPage, page: (pagination.current_page + 1) }))}>Next</Button>
          </div>
        </div>
      )}

      {/* Move dialog */}
      {canEdit && (
        <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move selected media</DialogTitle>
              <DialogDescription>
                Choose a destination folder for {selected.size} selected item{selected.size === 1 ? '' : 's'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Filter folders by name or path…"
                value={moveFilter}
                onChange={(e) => setMoveFilter(e.target.value)}
              />
              <div className="max-h-64 overflow-auto border rounded">
                <ul className="divide-y">
                  {filteredAllFolders.map((f) => (
                    <li key={f.id}>
                      <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
                        <input
                          type="radio"
                          name="move-target"
                          value={f.id}
                          checked={moveTargetId === f.id}
                          onChange={() => setMoveTargetId(f.id)}
                        />
                        <span className="text-sm">{f.path || f.name}</span>
                      </label>
                    </li>
                  ))}
                  {filteredAllFolders.length === 0 && (
                    <li className="px-3 py-2 text-sm text-muted-foreground">No folders match your filter.</li>
                  )}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="button" onClick={submitMove} disabled={!moveTargetId || selected.size === 0 || moveTargetId === currentFolderId}>
                Move {selected.size} item{selected.size === 1 ? '' : 's'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
