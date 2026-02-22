import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { ActiveThemeCard } from '../../components/themes/ActiveThemeCard';
import { InstalledThemesGrid } from '../../components/themes/InstalledThemesGrid';
import { DiscoveredThemesList } from '../../components/themes/DiscoveredThemesList';
import { ThemeDetails } from '../../components/themes/ThemeDetails';
import { asArray } from '../../types';

export function getThemesSections({
  themes,
  discoveredThemes,
  activeTheme,
  theme,
  can,
  showSuccess,
  showError,
  ROUTE,
  t,
}: {
  themes: any;
  discoveredThemes: any;
  activeTheme: any;
  theme: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}): Record<string, () => ReactNode> {
  const renderThemesMain = () => {
    const installedThemesArr = asArray(themes as any);
    const installedSlugs = new Set(installedThemesArr.map((it: any) => it.slug));

    return (
      <SectionWrapper
        title={t('dashboard.themes.title')}
        description={t('dashboard.themes.description')}
        actions={
          can('install themes') ? (
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await router.post(ROUTE.themes.discover(), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                      showSuccess(t('dashboard.themes.messages.discovered'));
                      router.reload({ only: ['themes', 'discoveredThemes', 'activeTheme'] });
                    },
                    onError: () => showError(t('dashboard.themes.messages.discover_failed')),
                  });
                } catch (e) {
                  console.error(e);
                  showError(t('dashboard.themes.messages.discover_error'));
                }
              }}
            >
              {t('dashboard.themes.actions.discover')}
            </Button>
          ) : null
        }
      >
        <div className="space-y-8">
          <ActiveThemeCard
            activeTheme={activeTheme as any}
            canPublishAssets={can('publish theme assets')}
            onPublishAssets={async (themeId) => {
              try {
                await router.post(ROUTE.themes.publishAssets(themeId), {}, {
                  preserveScroll: true,
                  onSuccess: () => showSuccess(t('dashboard.themes.messages.assets_published')),
                  onError: () => showError(t('dashboard.themes.messages.assets_failed')),
                });
              } catch (e) {
                console.error(e);
                showError(t('dashboard.themes.messages.assets_error'));
              }
            }}
            onView={(themeId) => router.visit(ROUTE.themes.show(themeId))}
          />

          <InstalledThemesGrid
            items={installedThemesArr as any}
            activeSlug={(activeTheme as any)?.slug}
            canActivate={can('activate themes')}
            canPublishAssets={can('publish theme assets')}
            canDelete={can('delete themes')}
            onView={(id) => router.visit(ROUTE.themes.show(id))}
            onActivate={async (slug) => {
              try {
                await router.post(ROUTE.themes.activate(slug), {}, {
                  preserveScroll: true,
                  onSuccess: () => {
                    showSuccess(t('dashboard.themes.messages.activated'));
                    router.reload({ only: ['themes', 'activeTheme'] });
                  },
                  onError: () => showError(t('dashboard.themes.messages.activate_failed')),
                });
              } catch (e) {
                console.error(e);
                showError(t('dashboard.themes.messages.activate_error'));
              }
            }}
            onPublishAssets={async (id) => {
              try {
                await router.post(ROUTE.themes.publishAssets(id), {}, {
                  preserveScroll: true,
                  onSuccess: () => showSuccess(t('dashboard.themes.messages.assets_published')),
                  onError: () => showError(t('dashboard.themes.messages.assets_failed')),
                });
              } catch (e) {
                console.error(e);
                showError(t('dashboard.themes.messages.assets_error'));
              }
            }}
            onUninstall={async (id, displayName) => {
              if (!confirm(t('dashboard.themes.confirm_uninstall', { name: displayName ?? '' }))) return;
              try {
                await router.delete(ROUTE.themes.destroy(id), {
                  preserveScroll: true,
                  onSuccess: () => {
                    showSuccess(t('dashboard.themes.messages.uninstalled'));
                    router.reload({ only: ['themes', 'discoveredThemes'] });
                  },
                  onError: () => showError(t('dashboard.themes.messages.uninstall_failed')),
                });
              } catch (e) {
                console.error(e);
                showError(t('dashboard.themes.messages.uninstall_error'));
              }
            }}
          />

          <DiscoveredThemesList
            items={asArray(discoveredThemes as any)
              .filter((t: any) => !installedSlugs.has(t?.config?.slug || t?.slug))
              .map((t: any) => ({
                slug: t?.slug ?? t?.config?.slug,
                name: t?.name ?? t?.config?.name,
                config: t?.config,
              }))}
          />
        </div>
      </SectionWrapper>
    );
  };

  const renderThemeDetails = () => (
    <SectionWrapper
      title={t('dashboard.themes.details_title')}
      description={t('dashboard.themes.details_description')}
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.themes.index())}>
          {t('dashboard.themes.actions.back')}
        </Button>
      }
    >
      <ThemeDetails
        theme={theme as any}
        canActivate={can('activate themes')}
        canPublishAssets={can('publish theme assets')}
        onActivate={async (slug) => {
          try {
            await router.post(ROUTE.themes.activate(slug), {}, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(t('dashboard.themes.messages.activated'));
                router.reload({ only: ['themes', 'activeTheme'] });
              },
              onError: () => showError(t('dashboard.themes.messages.activate_failed')),
            });
          } catch (e) {
            console.error(e);
            showError(t('dashboard.themes.messages.activate_error'));
          }
        }}
        onPublishAssets={async (id) => {
          try {
            await router.post(ROUTE.themes.publishAssets(id), {}, {
              preserveScroll: true,
              onSuccess: () => showSuccess(t('dashboard.themes.messages.assets_published')),
              onError: () => showError(t('dashboard.themes.messages.assets_failed')),
            });
          } catch (e) {
            console.error(e);
            showError(t('dashboard.themes.messages.assets_error'));
          }
        }}
        onUninstall={async (id, displayName) => {
          if (!confirm(t('dashboard.themes.confirm_uninstall', { name: displayName }))) return;
          try {
            await router.delete(ROUTE.themes.destroy(id), {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess(t('dashboard.themes.messages.uninstalled'));
                router.reload({ only: ['themes', 'discoveredThemes'] });
              },
              onError: () => showError(t('dashboard.themes.messages.uninstall_failed')),
            });
          } catch (e) {
            console.error(e);
            showError(t('dashboard.themes.messages.uninstall_error'));
          }
        }}
      />
    </SectionWrapper>
  );

  const renderThemeCustomizer = () => (
    <SectionWrapper
      title="Theme Customizer"
      description="Theme customizer has been removed."
    >
      <div className="text-muted-foreground text-sm">The theme customizer is no longer available. Edit theme files directly.</div>
    </SectionWrapper>
  );

  return {
    themes: renderThemesMain,
    'themes.show': renderThemeDetails,
    'themes.customizer': renderThemeCustomizer,
  };
}
