import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { SitemapSettingsForm } from '../../components/sitemap/SitemapSettingsForm';

export function getSitemapSections({
  postTypes,
  sitemapSettings,
  can,
  ROUTE,
}: {
  postTypes: any;
  sitemapSettings: any;
  can: (perm: string) => boolean;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const renderSitemap = () => (
    <SectionWrapper
      title="Sitemap"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
    >
      <SitemapSettingsForm
        postTypes={(postTypes as any) || []}
        settings={(sitemapSettings as any) || { include_taxonomies: true, enable_cache: true, cache_ttl: 3600 }}
        canEdit={can('edit settings')}
      />
    </SectionWrapper>
  );

  return {
    sitemap: renderSitemap,
  };
}
