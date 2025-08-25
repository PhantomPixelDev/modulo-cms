import * as React from 'react';
import { Button } from '@/components/ui/button';

export interface ActiveThemeCardProps {
  activeTheme?: any | null;
  canPublishAssets?: boolean;
  canCustomize?: boolean;
  onPublishAssets?: (themeId: number) => void;
  onCustomize?: (themeId: number) => void;
  onView?: (themeId: number) => void;
}

export function ActiveThemeCard({ activeTheme, canPublishAssets = false, canCustomize = false, onPublishAssets, onCustomize, onView }: ActiveThemeCardProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Active Theme</h3>
      <div className="border rounded-md p-4">
        {activeTheme ? (
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              {(() => {
                const cfg = activeTheme?.config || {};
                const previewPath = cfg.preview || cfg.screenshot;
                return previewPath ? (
                  <img
                    src={`/themes/${activeTheme.slug}/${previewPath}`}
                    alt={activeTheme.name || activeTheme.slug}
                    className="w-20 h-14 object-cover rounded border"
                  />
                ) : null;
              })()}
              <div>
                <div className="font-medium">{activeTheme.name || activeTheme.slug}</div>
                <div className="text-xs text-muted-foreground">Slug: {activeTheme.slug}</div>
                {(activeTheme?.config?.version || activeTheme?.config?.author) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {activeTheme?.config?.version && <span>Version: {activeTheme.config.version}</span>}
                    {(activeTheme?.config?.version && activeTheme?.config?.author) && <span> · </span>}
                    {activeTheme?.config?.author && (
                      activeTheme?.config?.author_url ? (
                        <a className="underline" href={activeTheme.config.author_url} target="_blank" rel="noreferrer">
                          {activeTheme.config.author}
                        </a>
                      ) : (
                        <span>{activeTheme.config.author}</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {canPublishAssets && (
                <Button size="sm" variant="secondary" onClick={() => activeTheme?.id && onPublishAssets?.(activeTheme.id)}>Publish Assets</Button>
              )}
              {canCustomize && (
                <Button size="sm" onClick={() => activeTheme?.id && onCustomize?.(activeTheme.id)}>Customize</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => activeTheme?.id && onView?.(activeTheme.id)}>View</Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No active theme</div>
        )}
      </div>
    </div>
  );
}
