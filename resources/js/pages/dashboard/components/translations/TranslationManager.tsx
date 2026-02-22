import { FormEvent, useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableContainer } from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { ROUTE } from '../../routes';
import type { Locale, TranslationEntry, TranslationManagerPayload } from '../../types';
import { Copy, Loader2, RefreshCcw, Search } from 'lucide-react';

interface TranslationManagerProps extends TranslationManagerPayload {
  canEdit: boolean;
}

type DraftState = Record<string, string>;

const stringifyValue = (value?: string | null) => {
  if (value === null || value === undefined) return '';
  return typeof value === 'string' ? value : String(value);
};

export function TranslationManager({
  entries,
  locales,
  domains,
  currentLocale,
  currentDomain,
  search,
  overrideCount,
  canEdit,
}: TranslationManagerProps) {
  const { t } = useTranslation();
  const { success: showSuccess, error: showError } = useAdminToast();
  const [drafts, setDrafts] = useState<DraftState>({});
  const [searchTerm, setSearchTerm] = useState(search ?? '');
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    const initial: DraftState = {};
    entries.forEach((entry) => {
      initial[entry.key] = stringifyValue(entry.override);
    });
    setDrafts(initial);
  }, [entries]);

  useEffect(() => {
    setSearchTerm(search ?? '');
  }, [search]);

  const totalKeys = entries.length;
  const localeOptions = locales as Locale[];

  const visitWithParams = (params: { locale?: string; domain?: string; q?: string }) => {
    router.visit(ROUTE.translations.index(params), {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleLocaleChange = (localeCode: string) => {
    visitWithParams({ locale: localeCode, domain: currentDomain, q: searchTerm || undefined });
  };

  const handleDomainChange = (domain: string) => {
    visitWithParams({ locale: currentLocale, domain, q: searchTerm || undefined });
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    visitWithParams({ locale: currentLocale, domain: currentDomain, q: searchTerm?.trim() || undefined });
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    visitWithParams({ locale: currentLocale, domain: currentDomain });
  };

  const updateDraft = (key: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const copyBaseValue = (entry: TranslationEntry) => {
    if (!canEdit) return;
    updateDraft(entry.key, stringifyValue(entry.value));
  };

  const handleSave = async (entry: TranslationEntry) => {
    if (!canEdit) return;
    const value = drafts[entry.key] ?? '';
    setPendingKey(entry.key);
    try {
      await router.post(
        ROUTE.translations.store(),
        {
          locale: currentLocale,
          domain: currentDomain,
          key: entry.key,
          value,
        },
        {
          preserveScroll: true,
          onSuccess: () => showSuccess(t('dashboard.translations.messages.saved')),
          onError: () => showError(t('dashboard.translations.messages.save_failed')),
        }
      );
    } finally {
      setPendingKey(null);
    }
  };

  const handleReset = async (entry: TranslationEntry) => {
    if (!canEdit) return;
    setPendingKey(entry.key);
    updateDraft(entry.key, '');
    try {
      await router.post(
        ROUTE.translations.store(),
        {
          locale: currentLocale,
          domain: currentDomain,
          key: entry.key,
          value: '',
        },
        {
          preserveScroll: true,
          onSuccess: () => showSuccess(t('dashboard.translations.messages.saved')),
          onError: () => showError(t('dashboard.translations.messages.save_failed')),
        }
      );
    } finally {
      setPendingKey(null);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await router.post(
        ROUTE.translations.clearCache(),
        { locale: currentLocale },
        {
          preserveScroll: true,
          onSuccess: () => showSuccess(t('dashboard.translations.messages.cache_cleared')),
          onError: () => showError(t('dashboard.translations.messages.cache_failed')),
        }
      );
    } finally {
      setIsClearingCache(false);
    }
  };

  const rows = useMemo(() => entries, [entries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('dashboard.translations.stats.total', { count: totalKeys })}</p>
            <p className="text-xs text-muted-foreground">{t('dashboard.translations.stats.overrides', { count: overrideCount })}</p>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleClearCache} disabled={isClearingCache}>
              {isClearingCache && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('dashboard.translations.actions.clear_cache')}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {localeOptions.length > 1 && (
            <Select value={currentLocale} onValueChange={handleLocaleChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('dashboard.translations.locale_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {localeOptions.map((locale) => (
                  <SelectItem key={locale.code} value={locale.code}>
                    <span className="font-medium">{locale.code.toUpperCase()}</span>
                    {locale.native_name && (
                      <span className="ml-2 text-xs text-muted-foreground">{locale.native_name}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {domains.length > 0 && (
            <Select value={currentDomain} onValueChange={handleDomainChange}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder={t('dashboard.translations.domain_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('dashboard.translations.search_placeholder')}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="secondary">
            {t('dashboard.translations.actions.search')}
          </Button>
          {search || searchTerm ? (
            <Button type="button" variant="ghost" onClick={handleClearSearch}>
              {t('dashboard.translations.actions.reset_filters')}
            </Button>
          ) : null}
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t('dashboard.translations.empty')}
        </div>
      ) : (
        <TableContainer className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-64">{t('dashboard.translations.table.key')}</TableHead>
                <TableHead>{t('dashboard.translations.table.base_value')}</TableHead>
                <TableHead className="w-96">{t('dashboard.translations.table.custom_value')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((entry) => {
                const draftValue = drafts[entry.key] ?? '';
                const savedValue = stringifyValue(entry.override);
                const originalValue = stringifyValue(entry.value);
                const isDirty = draftValue !== savedValue;
                const isPending = pendingKey === entry.key;
                const showOverrideBadge = entry.is_overridden || draftValue.length > 0;

                return (
                  <TableRow key={entry.key}>
                    <TableCell className="align-top">
                      <div className="font-mono text-xs break-all text-foreground">{entry.key}</div>
                      {showOverrideBadge && (
                        <Badge variant="secondary" className="mt-2">
                          {entry.is_overridden
                            ? t('dashboard.translations.badges.override')
                            : t('dashboard.translations.badges.draft')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="align-top text-sm text-muted-foreground whitespace-pre-wrap">
                      {originalValue || <span className="text-xs opacity-70">—</span>}
                    </TableCell>
                    <TableCell className="align-top">
                      <Textarea
                        value={draftValue}
                        onChange={(e) => updateDraft(entry.key, e.target.value)}
                        placeholder={t('dashboard.translations.override_placeholder')}
                        disabled={!canEdit}
                        className="min-h-[80px]"
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(entry)}
                          disabled={!canEdit || (!isDirty && !entry.is_overridden) || isPending}
                        >
                          {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCcw className="mr-2 h-4 w-4" />
                          )}
                          {t('dashboard.translations.actions.save_override')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReset(entry)}
                          disabled={!canEdit || (!entry.is_overridden && !draftValue) || isPending}
                        >
                          {t('dashboard.translations.actions.clear_override')}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyBaseValue(entry)}
                          disabled={!canEdit}
                          title={t('dashboard.translations.actions.copy_base')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}
