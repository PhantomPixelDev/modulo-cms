import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { SiteSettingsForm } from '../../components/settings/SiteSettingsForm';
import { SystemInfoCard } from '../../components/settings/SystemInfoCard';
import type { DashboardProps } from '../../types';

export function getSiteSettingsSections({
    settings,
    settingsGroup,
    pages,
    postTypes,
    timezones,
    locales,
    currentLocale,
    can,
    t,
}: Pick<DashboardProps, 'settings' | 'settingsGroup' | 'pages' | 'postTypes' | 'timezones' | 'locales' | 'currentLocale'> & {
    can: (perm: string) => boolean;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
    const renderSiteSettings = () => {
        return (
            <SectionWrapper
                title={t('dashboard.settings.title')}
                description={t('dashboard.settings.description')}
                actions={
                    <div className="flex items-center gap-2">
                        <ClearSettingsCacheButton canEdit={can('edit settings')} t={t} />
                    </div>
                }
            >
                <SiteSettingsForm
                    settings={settings || {}}
                    currentGroup={settingsGroup || 'general'}
                    pages={pages || []}
                    postTypes={postTypes || []}
                    timezones={timezones || []}
                    canEdit={can('edit settings')}
                    locales={locales}
                    currentLocale={currentLocale}
                />

                <div className="mt-6">
                    <SystemInfoCard description="Include this when reporting a problem." />
                </div>
            </SectionWrapper>
        );
    };

    return {
        'site-settings': renderSiteSettings,
    };
}

// A real component, so the toast hook is called under the rules of hooks
function ClearSettingsCacheButton({ canEdit, t }: { canEdit: boolean; t: (key: string, replacements?: Record<string, string | number>) => string }) {
    const { success: showSuccess } = useAdminToast();

    const handleClearCache = () => {
        if (!canEdit) return;
        router.post(
            '/dashboard/admin/settings/clear-cache',
            {},
            {
                onSuccess: () => showSuccess(t('dashboard.settings.cache_cleared')),
            },
        );
    };

    return (
        <Button variant="outline" size="sm" onClick={handleClearCache} disabled={!canEdit}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t('dashboard.settings.actions.clear_cache')}
        </Button>
    );
}
