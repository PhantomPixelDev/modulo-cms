import { Button } from '@/components/ui/button';

interface ThemeDetailsProps {
  theme: any;
  canActivate?: boolean;
  canPublishAssets?: boolean;
  canCustomize?: boolean;
  onActivate: (slug: string) => void;
  onPublishAssets: (id: number) => void;
  onCustomize: (id: number) => void;
  onUninstall: (id: number, displayName: string) => void;
}

export function ThemeDetails({
  theme,
  canActivate = false,
  canPublishAssets = false,
  canCustomize = false,
  onActivate,
  onPublishAssets,
  onCustomize,
  onUninstall,
}: ThemeDetailsProps) {
  const t = theme || {};
  const cfg = (t.config || (theme as any)?.config || (theme as any)?.themeConfig) || ({} as any);
  const isActive = Boolean(t.is_active);
  const previewPath = cfg.preview || cfg.screenshot || t.screenshot;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {previewPath ? (
          <img
            src={`/themes/${t.slug}/${previewPath}`}
            alt={t.name || t.slug}
            className="w-40 h-28 object-cover rounded border"
          />
        ) : null}
        <div className="space-y-1 text-sm">
          <div className="text-lg font-semibold">{t.name || t.slug}</div>
          <div className="text-muted-foreground">Slug: {t.slug}</div>
          {cfg?.version && (
            <div className="text-muted-foreground">Version: {cfg.version}</div>
          )}
          {cfg?.author && (
            <div className="text-muted-foreground">
              Author: {cfg.author_url ? (
                <a href={cfg.author_url} className="underline" target="_blank" rel="noreferrer">{cfg.author}</a>
              ) : cfg.author}
            </div>
          )}
          {cfg?.description && (
            <div className="text-muted-foreground">{cfg.description}</div>
          )}
          {isActive && (
            <div className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Active</div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isActive && canActivate && (
          <Button size="sm" onClick={() => onActivate(t.slug)}>Activate</Button>
        )}
        {canPublishAssets && (
          <Button size="sm" variant="secondary" onClick={() => onPublishAssets(t.id)}>Publish Assets</Button>
        )}
        {isActive && canCustomize && (
          <Button size="sm" onClick={() => onCustomize(t.id)}>Customize</Button>
        )}
        {!isActive && (
          <Button size="sm" variant="destructive" onClick={() => onUninstall(t.id, t.name || t.slug)}>Uninstall</Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-2">Features</h4>
          <div className="text-sm text-muted-foreground">
            {(Array.isArray(t.tags) && t.tags.length > 0) && (
              <div className="mb-2">Tags: {t.tags.join(', ')}</div>
            )}
            {cfg?.supports && Object.keys(cfg.supports).length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(cfg.supports).map(([k, v]: any) => (
                  <li key={k}>{k}: {String(v)}</li>
                ))}
              </ul>
            ) : (
              <div>—</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Menus</h4>
          <div className="text-sm text-muted-foreground">
            {cfg?.menus && Object.keys(cfg.menus).length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(cfg.menus).map(([k, v]: any) => (
                  <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                ))}
              </ul>
            ) : (
              <div>—</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Widget Areas</h4>
          <div className="text-sm text-muted-foreground">
            {t?.widget_areas && Object.keys(t.widget_areas).length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(t.widget_areas).map(([k, v]: any) => (
                  <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                ))}
              </ul>
            ) : (
              <div>—</div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Templates</h4>
          <div className="text-sm text-muted-foreground">
            {t?.templates && Object.keys(t.templates).length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {Object.entries(t.templates).map(([k, v]: any) => (
                  <li key={k}><span className="font-medium">{k}</span>: {String(v)}</li>
                ))}
              </ul>
            ) : (
              <div>—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
