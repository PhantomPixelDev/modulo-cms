import * as React from 'react';
import { Button } from '@/components/ui/button';

export interface InstalledThemeItem {
  id: number;
  slug: string;
  name?: string;
  is_active?: boolean;
  config?: {
    preview?: string;
    screenshot?: string;
    version?: string;
    author?: string;
    author_url?: string;
  };
}

export interface InstalledThemesGridProps {
  items: InstalledThemeItem[];
  activeSlug?: string | null;
  canActivate?: boolean;
  canPublishAssets?: boolean;
  canCustomize?: boolean;
  canDelete?: boolean;
  onView?: (id: number) => void;
  onActivate?: (slug: string) => void;
  onPublishAssets?: (id: number) => void;
  onCustomize?: (id: number) => void;
  onUninstall?: (id: number, displayName?: string) => void;
}

export function InstalledThemesGrid({ items, activeSlug, canActivate = false, canPublishAssets = false, canCustomize = false, canDelete = false, onView, onActivate, onPublishAssets, onCustomize, onUninstall }: InstalledThemesGridProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Installed Themes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((t) => {
          const isActive = activeSlug === t.slug || t.is_active;
          const cfg = t?.config || {};
          const previewPath = cfg.preview || cfg.screenshot;
          return (
            <div key={t.id} className={`border rounded-md p-4 ${isActive ? 'ring-1 ring-accent' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  {previewPath ? (
                    <img
                      src={`/themes/${t.slug}/${previewPath}`}
                      alt={t.name || t.slug}
                      className="w-20 h-14 object-cover rounded border"
                    />
                  ) : null}
                  <div>
                    <div className="font-medium">{t.name || t.slug}</div>
                    <div className="text-xs text-muted-foreground">Slug: {t.slug}</div>
                    {(cfg?.version || cfg?.author) && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {cfg?.version && <span>Version: {cfg.version}</span>}
                        {(cfg?.version && cfg?.author) && <span> · </span>}
                        {cfg?.author && (
                          cfg?.author_url ? (
                            <a className="underline" href={cfg.author_url} target="_blank" rel="noreferrer">{cfg.author}</a>
                          ) : (
                            <span>{cfg.author}</span>
                          )
                        )}
                      </div>
                    )}
                    {isActive && <div className="mt-1 text-xs inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onView?.(t.id)}>View</Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!isActive && canActivate && (
                  <Button size="sm" onClick={() => onActivate?.(t.slug)}>Activate</Button>
                )}
                {canPublishAssets && (
                  <Button size="sm" variant="secondary" onClick={() => onPublishAssets?.(t.id)}>Publish Assets</Button>
                )}
                {isActive && canCustomize && (
                  <Button size="sm" onClick={() => onCustomize?.(t.id)}>Customize</Button>
                )}
                {!isActive && canDelete && (
                  <Button size="sm" variant="destructive" onClick={() => onUninstall?.(t.id, t.name || t.slug)}>Uninstall</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
