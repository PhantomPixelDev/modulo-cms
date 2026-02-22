import type { ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { SitemapSettingsForm } from '../../components/sitemap/SitemapSettingsForm';

export function getSitemapSections({
  postTypes,
  sitemapSettings,
  locales,
  currentLocale,
  can,
  ROUTE,
  t,
}: {
  postTypes: any;
  sitemapSettings: any;
  locales?: any[];
  currentLocale?: string;
  can: (perm: string) => boolean;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderSitemap = () => (
    <SectionWrapper
      title={t('dashboard.sitemap.title')}
      description={t('dashboard.sitemap.description')}
    >
      <SitemapSettingsForm
        postTypes={(postTypes as any) || []}
        settings={(sitemapSettings as any) || { include_taxonomies: true, enable_cache: true, cache_ttl: 3600 }}
        locales={locales || []}
        currentLocale={currentLocale}
        canEdit={can('edit settings')}
      />
    </SectionWrapper>
  );

  return {
    sitemap: renderSitemap,
  };
}
