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
}: {
  plugins: any;
  plugin: any;
  can: (perm: string) => boolean;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const renderPlugins = () => (
    <SectionWrapper
      title="Plugins"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
          Back to Dashboard
        </Button>
      }
    >
      <PluginsList plugins={plugins || []} canEdit={can('edit settings')} />
    </SectionWrapper>
  );

  const renderPluginSettings = () => (
    <SectionWrapper
      title="Plugin Settings"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.plugins.index())}>
          Back to Plugins
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
