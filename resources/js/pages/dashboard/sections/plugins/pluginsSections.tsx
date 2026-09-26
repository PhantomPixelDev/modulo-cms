import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { PluginBrowser } from '../../components/plugins/PluginBrowser';
import { PluginSettingsForm } from '../../components/plugins/PluginSettingsForm';
import { PluginsList } from '../../components/plugins/PluginsList';
import type { CustomFieldDefinition } from '../../types';

export function getPluginsSections({
    plugins,
    plugin,
    settingsSchema,
    can,
    ROUTE,
    t,
}: {
    plugins: any;
    plugin: any;
    settingsSchema?: CustomFieldDefinition[];
    can: (perm: string) => boolean;
    ROUTE: any;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
    const canManagePlugins = can('activate plugins') || can('deactivate plugins');

    const renderPlugins = () => (
        <SectionWrapper
            title={t('dashboard.plugins.title')}
            description={t('dashboard.plugins.description')}
            actions={
                can('install plugins') ? (
                    <Button variant="outline" size="sm" onClick={() => router.post(ROUTE.plugins.discover(), {}, { preserveScroll: true })}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t('dashboard.plugins.actions.discover')}
                    </Button>
                ) : undefined
            }
        >
            <Tabs defaultValue="installed">
                <TabsList className="mb-6">
                    <TabsTrigger value="installed">Installed</TabsTrigger>
                    <TabsTrigger value="browse">Browse registry</TabsTrigger>
                </TabsList>
                <TabsContent value="installed">
                    <PluginsList plugins={plugins || []} canEdit={canManagePlugins} />
                </TabsContent>
                <TabsContent value="browse">
                    <PluginBrowser canInstall={can('install plugins')} />
                </TabsContent>
            </Tabs>
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
            <PluginSettingsForm plugin={plugin} schema={settingsSchema} canEdit={can('install plugins')} />
        </SectionWrapper>
    );

    return {
        plugins: renderPlugins,
        'plugin-settings': renderPluginSettings,
    };
}
