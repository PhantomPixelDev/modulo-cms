import * as React from 'react';

export interface DiscoveredThemeItem {
  slug: string;
  name?: string;
  config?: {
    slug?: string;
    name?: string;
    version?: string;
    author?: string;
    author_url?: string;
  };
}

export interface DiscoveredThemesListProps {
  items: DiscoveredThemeItem[];
}

export function DiscoveredThemesList({ items }: DiscoveredThemesListProps) {
  return (
    <div>
      <h3 className="font-semibold mb-3">Discovered Themes</h3>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No uninstalled themes discovered.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t.config?.slug || t.slug} className="border rounded-md p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name || t.config?.name || t.slug}</div>
                <div className="text-xs text-muted-foreground">Slug: {t.config?.slug || t.slug}</div>
                {(t?.config?.version || t?.config?.author) && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t?.config?.version && <span>Version: {t.config.version}</span>}
                    {(t?.config?.version && t?.config?.author) && <span> · </span>}
                    {t?.config?.author && (
                      t?.config?.author_url ? (
                        <a className="underline" href={t.config.author_url} target="_blank" rel="noreferrer">{t.config.author}</a>
                      ) : (
                        <span>{t.config.author}</span>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
