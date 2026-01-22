import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { SiteSettingsForm } from '../../components/settings/SiteSettingsForm';

export function getSiteSettingsSections({
  settings,
  settingsGroup,
  pages,
  timezones,
  can,
  ROUTE,
}: {
  settings: any;
  settingsGroup: any;
  pages: any;
  timezones: any;
  can: (perm: string) => boolean;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const renderSiteSettings = () => (
    <SectionWrapper
      title="Site Settings"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
    >
      <SiteSettingsForm
        settings={(settings || {}) as Record<string, Record<string, any>>}
        currentGroup={(settingsGroup as any) || 'general'}
        pages={pages || []}
        timezones={timezones || []}
        canEdit={can('edit settings')}
      />
    </SectionWrapper>
  );

  return {
    'site-settings': renderSiteSettings,
  };
}
