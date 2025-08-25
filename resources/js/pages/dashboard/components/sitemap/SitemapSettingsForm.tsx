import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { PostType } from '../../types';
import { ROUTE } from '../../routes';

export type SitemapSettings = {
  included_post_type_ids?: number[] | null;
  include_taxonomies: boolean;
  enable_cache: boolean;
  cache_ttl: number;
  last_generated_at?: string | null;
};

export function SitemapSettingsForm({
  postTypes = [],
  settings,
  canEdit,
}: {
  postTypes: PostType[];
  settings: SitemapSettings;
  canEdit: boolean;
}) {
  const [included, setIncluded] = useState<Set<number>>(
    new Set((settings.included_post_type_ids ?? undefined) as number[] | undefined)
  );
  const [includeTax, setIncludeTax] = useState<boolean>(Boolean(settings.include_taxonomies));
  const [enableCache, setEnableCache] = useState<boolean>(Boolean(settings.enable_cache));
  const [ttl, setTtl] = useState<number>(Number(settings.cache_ttl ?? 3600));

  const sortedPublic = useMemo(
    () => [...postTypes].sort((a, b) => (a.menu_position ?? 0) - (b.menu_position ?? 0)),
    [postTypes]
  );

  const toggle = (id: number) => {
    if (!canEdit) return;
    const next = new Set(included);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setIncluded(next);
  };

  const selectAll = () => {
    if (!canEdit) return;
    setIncluded(new Set(sortedPublic.map((pt) => pt.id)));
  };
  const clearAll = () => {
    if (!canEdit) return;
    setIncluded(new Set());
  };

  const onSave = async () => {
    if (!canEdit) return;
    const payload = {
      included_post_type_ids: Array.from(included),
      include_taxonomies: includeTax,
      enable_cache: enableCache,
      cache_ttl: Math.max(60, Math.min(86400, Number(ttl) || 3600)),
    };
    try {
      await router.put(ROUTE.sitemap.update(), payload, {
        preserveScroll: true,
        onSuccess: () => toast.success('Sitemap settings saved'),
        onError: () => toast.error('Failed to save sitemap settings'),
      });
    } catch (e) {
      console.error(e);
      toast.error('Error saving sitemap settings');
    }
  };

  const onRegenerate = async () => {
    if (!canEdit) return;
    try {
      await router.post(ROUTE.sitemap.regenerate(), {}, {
        preserveScroll: true,
        onSuccess: () => toast.success('Sitemap regenerated'),
        onError: () => toast.error('Failed to regenerate sitemap'),
      });
    } catch (e) {
      console.error(e);
      toast.error('Error regenerating sitemap');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Included Post Types</h3>
          <p className="text-sm text-muted-foreground">Select which public post types to include in the sitemap.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
            <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {sortedPublic.map((pt) => (
          <label key={pt.id} className="flex items-center gap-2 p-2 rounded border">
            <input
              type="checkbox"
              checked={included.has(pt.id)}
              onChange={() => toggle(pt.id)}
              disabled={!canEdit}
            />
            <span>{pt.label ?? pt.name}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Options</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} disabled={!canEdit} />
          <span>Include taxonomy archives (tags, categories)</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={enableCache} onChange={(e) => setEnableCache(e.target.checked)} disabled={!canEdit} />
          <span>Enable sitemap cache</span>
        </label>
        <div className="flex items-center gap-3">
          <label className="text-sm w-40">Cache TTL (seconds)</label>
          <input
            type="number"
            min={60}
            max={86400}
            value={ttl}
            onChange={(e) => setTtl(Number(e.target.value))}
            className="border rounded px-2 py-1 w-40"
            disabled={!canEdit}
          />
        </div>
        {settings.last_generated_at && (
          <p className="text-xs text-muted-foreground">Last generated: {new Date(settings.last_generated_at).toLocaleString()}</p>
        )}
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Button onClick={onSave}>Save Settings</Button>
          <Button variant="outline" onClick={onRegenerate}>Regenerate Sitemap</Button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3 py-2 border rounded text-sm"
          >
            View sitemap.xml
          </a>
        </div>
      )}
    </div>
  );
}
