import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { SiteSettingsForm } from '../../components/settings/SiteSettingsForm';
import { useAdminToast } from '@/components/admin/AdminToastProvider';

export function getSiteSettingsSections({
  settings,
  settingsGroup,
  pages,
  postTypes,
  timezones,
  locales,
  currentLocale,
  can,
  ROUTE,
  t,
}: {
  settings: any;
  settingsGroup: any;
  pages: any;
  postTypes?: any;
  timezones: any;
  locales?: any[];
  currentLocale?: string;
  can: (perm: string) => boolean;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderSiteSettings = () => {
    const { success: showSuccess } = useAdminToast();
    
    const handleClearCache = () => {
      if (!can('edit settings')) return;
      router.post('/dashboard/admin/settings/clear-cache', {}, {
        onSuccess: () => showSuccess(t('dashboard.settings.cache_cleared')),
      });
    };

    return (
      <SectionWrapper
        title={t('dashboard.settings.title')}
        description={t('dashboard.settings.description')}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCache}
              disabled={!can('edit settings')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('dashboard.settings.actions.clear_cache')}
            </Button>
          </div>
        }
      >
        <SiteSettingsForm
          settings={(settings || {}) as Record<string, Record<string, any>>}
          currentGroup={(settingsGroup as any) || 'general'}
          pages={pages || []}
          postTypes={postTypes || []}
          timezones={timezones || []}
          canEdit={can('edit settings')}
          locales={locales}
          currentLocale={currentLocale}
        />
      </SectionWrapper>
    );
  };

  return {
    'site-settings': renderSiteSettings,
  };
}
