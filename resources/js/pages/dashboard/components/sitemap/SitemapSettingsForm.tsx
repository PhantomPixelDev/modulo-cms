import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import type { Locale, PostType, SitemapCustomUrl, SitemapSettings as SitemapSettingsDto } from '../../types';
import { ROUTE } from '../../routes';
import { useTranslation } from '@/hooks/useTranslation';
import { Globe, Plus, Trash2 } from 'lucide-react';

type SitemapSettings = SitemapSettingsDto;

const resolveLocale = (locales?: Locale[], preferred?: string) => {
  if (preferred) return preferred;
  const defaultLocale = locales?.find((locale) => locale.is_default)?.code;
  return defaultLocale || locales?.[0]?.code || 'en';
};

const changefreqOptions = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

export function SitemapSettingsForm({
  postTypes = [],
  settings,
  locales = [],
  currentLocale,
  canEdit,
}: {
  postTypes: PostType[];
  settings: SitemapSettings;
  locales?: Locale[];
  currentLocale?: string;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const { success: showSuccess, error: showError } = useAdminToast();
  const [selectedLocale, setSelectedLocale] = useState<string>(resolveLocale(locales, currentLocale));
  const [included, setIncluded] = useState<Set<number>>(new Set(settings.included_post_type_ids ?? undefined));
  const [includeTax, setIncludeTax] = useState<boolean>(Boolean(settings.include_taxonomies));
  const [enableCache, setEnableCache] = useState<boolean>(Boolean(settings.enable_cache));
  const [ttl, setTtl] = useState<number>(Number(settings.cache_ttl ?? 3600));
  const [customUrls, setCustomUrls] = useState<SitemapCustomUrl[]>(settings.custom_urls ?? []);

  const sortedPublic = useMemo(
    () => [...postTypes].sort((a, b) => (a.menu_position ?? 0) - (b.menu_position ?? 0)),
    [postTypes]
  );

  useEffect(() => {
    setIncluded(new Set(settings.included_post_type_ids ?? undefined));
    setIncludeTax(Boolean(settings.include_taxonomies));
    setEnableCache(Boolean(settings.enable_cache));
    setTtl(Number(settings.cache_ttl ?? 3600));
    setCustomUrls(settings.custom_urls ?? []);
  }, [settings]);

  useEffect(() => {
    setSelectedLocale(resolveLocale(locales, currentLocale));
  }, [locales, currentLocale]);

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

  const handleLocaleSwitch = (localeCode: string) => {
    setSelectedLocale(localeCode);
    router.get(
      ROUTE.sitemap.index(),
      { locale: localeCode },
      { preserveState: true, preserveScroll: true, replace: true }
    );
  };

  const handleCustomUrlChange = (index: number, key: keyof SitemapCustomUrl, value: string) => {
    setCustomUrls((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  };

  const addCustomUrl = () => {
    if (!canEdit) return;
    setCustomUrls((prev) => [...prev, { loc: '' }]);
  };

  const removeCustomUrl = (index: number) => {
    if (!canEdit) return;
    setCustomUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const sanitizeCustomUrls = (): SitemapCustomUrl[] =>
    customUrls
      .map((entry) => ({
        ...entry,
        loc: entry.loc?.trim() ?? '',
        lastmod: entry.lastmod?.trim() || undefined,
        changefreq: entry.changefreq?.trim() || undefined,
        priority: entry.priority === undefined || entry.priority === null || entry.priority === ('' as any)
          ? undefined
          : Number(entry.priority),
      }))
      .filter((entry) => entry.loc);

  const onSave = async () => {
    if (!canEdit) return;
    const payload = {
      included_post_type_ids: Array.from(included),
      include_taxonomies: includeTax,
      enable_cache: enableCache,
      cache_ttl: Math.max(60, Math.min(86400, Number(ttl) || 3600)),
      locale: selectedLocale,
      custom_urls: sanitizeCustomUrls(),
    };
    try {
      await router.put(ROUTE.sitemap.update(), payload, {
        preserveScroll: true,
        onSuccess: () => showSuccess(t('dashboard.sitemap.messages.saved')),
        onError: () => showError(t('dashboard.sitemap.messages.save_failed')),
      });
    } catch (e) {
      console.error(e);
      showError(t('dashboard.sitemap.messages.save_error'));
    }
  };

  const onRegenerate = async () => {
    if (!canEdit) return;
    try {
      await router.post(ROUTE.sitemap.regenerate(), { locale: selectedLocale }, {
        preserveScroll: true,
        onSuccess: () => showSuccess(t('dashboard.sitemap.messages.regenerated')),
        onError: () => showError(t('dashboard.sitemap.messages.regenerate_failed')),
      });
    } catch (e) {
      console.error(e);
      showError(t('dashboard.sitemap.messages.regenerate_error'));
    }
  };

  const sitemapPreviewUrl = selectedLocale ? `/sitemap.xml?locale=${encodeURIComponent(selectedLocale)}` : '/sitemap.xml';

  return (
    <div className="space-y-6">
      {locales.length > 1 && (
        <div className="flex items-center justify-end gap-3 p-3 border rounded-md bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{t('dashboard.sitemap.locale_selector')}</span>
          </div>
          <Select value={selectedLocale} onValueChange={handleLocaleSwitch}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locales.map((locale) => (
                <SelectItem key={locale.code} value={locale.code}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{locale.code.toUpperCase()}</span>
                    {locale.native_name && (
                      <span className="text-xs text-muted-foreground">{locale.native_name}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('dashboard.sitemap.sections.included_title')}</h3>
          <p className="text-sm text-muted-foreground">{t('dashboard.sitemap.sections.included_description')}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {t('dashboard.sitemap.actions.select_all')}
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              {t('dashboard.sitemap.actions.clear')}
            </Button>
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
        <h3 className="text-lg font-semibold">{t('dashboard.sitemap.sections.options')}</h3>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeTax} onChange={(e) => setIncludeTax(e.target.checked)} disabled={!canEdit} />
          <span>{t('dashboard.sitemap.fields.include_taxonomies')}</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={enableCache} onChange={(e) => setEnableCache(e.target.checked)} disabled={!canEdit} />
          <span>{t('dashboard.sitemap.fields.enable_cache')}</span>
        </label>
        <div className="flex items-center gap-3">
          <label className="text-sm w-40">{t('dashboard.sitemap.fields.cache_ttl')}</label>
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
          <p className="text-xs text-muted-foreground">
            {t('dashboard.sitemap.fields.last_generated', {
              date: new Date(settings.last_generated_at).toLocaleString(),
            })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{t('dashboard.sitemap.sections.custom_urls_title', { defaultValue: 'Custom URLs' })}</h3>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.sitemap.sections.custom_urls_description', { defaultValue: 'Add locale-specific URLs to include in this sitemap.' })}
            </p>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={addCustomUrl}>
              <Plus className="h-4 w-4 mr-1" />
              {t('dashboard.sitemap.actions.add_url', { defaultValue: 'Add URL' })}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {customUrls.length === 0 && (
            <p className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/20">
              {t('dashboard.sitemap.sections.custom_urls_empty', { defaultValue: 'No custom URLs added for this locale.' })}
            </p>
          )}

          {customUrls.map((customUrl, index) => (
            <div key={`custom-url-${index}`} className="border rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {t('dashboard.sitemap.fields.custom_url_label', { defaultValue: `Entry ${index + 1}` })}
                </p>
                {canEdit && (
                  <Button variant="ghost" size="icon" onClick={() => removeCustomUrl(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('dashboard.sitemap.fields.custom_loc', { defaultValue: 'Location' })}
                  </Label>
                  <Input
                    placeholder="/custom-path"
                    value={customUrl.loc || ''}
                    onChange={(e) => handleCustomUrlChange(index, 'loc', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('dashboard.sitemap.fields.custom_lastmod', { defaultValue: 'Last Modified' })}
                  </Label>
                  <Input
                    type="date"
                    value={customUrl.lastmod || ''}
                    onChange={(e) => handleCustomUrlChange(index, 'lastmod', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('dashboard.sitemap.fields.custom_changefreq', { defaultValue: 'Change Frequency' })}
                  </Label>
                  <Select
                    value={customUrl.changefreq || ''}
                    onValueChange={(val) => handleCustomUrlChange(index, 'changefreq', val)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('dashboard.sitemap.placeholders.select_changefreq', { defaultValue: 'Select frequency' })} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        {t('dashboard.sitemap.placeholders.none', { defaultValue: 'None' })}
                      </SelectItem>
                      {changefreqOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t('dashboard.sitemap.fields.custom_priority', { defaultValue: 'Priority' })}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step="0.1"
                    value={customUrl.priority ?? ''}
                    onChange={(e) => handleCustomUrlChange(index, 'priority', e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <Button onClick={onSave}>{t('dashboard.sitemap.actions.save')}</Button>
          <Button variant="outline" onClick={onRegenerate}>
            {t('dashboard.sitemap.actions.regenerate')}
          </Button>
          <a
            href={sitemapPreviewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center px-3 py-2 border rounded text-sm"
          >
            {t('dashboard.sitemap.actions.view')}
          </a>
        </div>
      )}
    </div>
  );
}
