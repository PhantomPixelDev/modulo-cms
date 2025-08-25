import React, { useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ROUTE } from '../../routes';
import type { MediaItem } from '../../types';

interface Props {
  items: MediaItem[];
  canUpload: boolean;
}

export const MediaLibrary: React.FC<Props> = ({ items, canUpload }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const onUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      await router.post(ROUTE.media.store(), formData, {
        forceFormData: true,
        onSuccess: () => router.reload({ only: ['media'] }),
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {canUpload && (
        <div className="flex items-center gap-2">
          <input type="file" ref={fileRef} />
          <Button size="sm" onClick={onUpload} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((m) => (
          <div key={m.id} className="border rounded p-2 flex flex-col gap-2">
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.thumb || m.url}
                alt={m.custom_properties?.alt || m.name}
                className="object-cover w-full h-full"
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
    </div>
  );
};
