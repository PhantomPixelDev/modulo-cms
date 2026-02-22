import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PluginsList } from '../../components/plugins/PluginsList';
import { PluginSettingsForm } from '../../components/plugins/PluginSettingsForm';

export function getPluginsSections({
  plugins,
  plugin,
  can,
  ROUTE,
  t,
}: {
  plugins: any;
  plugin: any;
  can: (perm: string) => boolean;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderPlugins = () => (
    <SectionWrapper
      title={t('dashboard.plugins.title')}
      description={t('dashboard.plugins.description')}
    >
      <PluginsList plugins={plugins || []} canEdit={can('edit settings')} />
    </SectionWrapper>
  );

  const renderPluginSettings = () => (
    <SectionWrapper
      title={t('dashboard.plugins.settings_title')}
      description={t('dashboard.plugins.settings_description')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.plugins.index())}>
          {t('dashboard.plugins.actions.back')}
        </Button>
      }
    >
      <PluginSettingsForm plugin={plugin} canEdit={can('edit settings')} />
    </SectionWrapper>
  );

  return {
    plugins: renderPlugins,
    'plugin-settings': renderPluginSettings,
  };
}
