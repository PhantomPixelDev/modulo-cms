import type { ReactNode } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '../../components/common/SectionWrapper';
import { ActiveThemeCard } from '../../components/themes/ActiveThemeCard';
import { InstalledThemesGrid } from '../../components/themes/InstalledThemesGrid';
import { DiscoveredThemesList } from '../../components/themes/DiscoveredThemesList';
import { ThemeDetails } from '../../components/themes/ThemeDetails';
import { ThemeCustomizerForm } from '../../components/themes/ThemeCustomizerForm';
import { asArray } from '../../types';

export function getThemesSections({
  themes,
  discoveredThemes,
  activeTheme,
  theme,
  customizerSettings,
  availableMenus,
  widgetAreas,
  can,
  showSuccess,
  showError,
  ROUTE,
}: {
  themes: any;
  discoveredThemes: any;
  activeTheme: any;
  theme: any;
  customizerSettings: any;
  availableMenus: any;
  widgetAreas: any;
  can: (perm: string) => boolean;
  showSuccess: (msg: string) => void;
  showError: (msg: string) => void;
  ROUTE: any;
}): Record<string, () => ReactNode> {
  const renderThemesMain = () => {
    const installedThemesArr = asArray(themes as any);
    const installedSlugs = new Set(installedThemesArr.map((it: any) => it.slug));

    return (
      <SectionWrapper
        title="Themes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.misc.dashboard())}>
              Back to Dashboard
            </Button>
            {can('install themes') && (
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await router.post(ROUTE.themes.discover(), {}, {
                      preserveScroll: true,
                      onSuccess: () => {
                        showSuccess('Discovered and installed themes');
                        router.reload({ only: ['themes', 'discoveredThemes', 'activeTheme'] });
                      },
                      onError: () => showError('Failed to discover/install themes'),
                    });
                  } catch (e) {
                    console.error(e);
                    showError('Error discovering themes');
                  }
                }}
              >
                Discover & Install All
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-8">
          <ActiveThemeCard
            activeTheme={activeTheme as any}
            canPublishAssets={can('publish theme assets')}
            canCustomize={can('customize themes')}
            onPublishAssets={async (themeId) => {
              try {
                await router.post(ROUTE.themes.publishAssets(themeId), {}, {
                  preserveScroll: true,
                  onSuccess: () => showSuccess('Assets published'),
                  onError: () => showError('Failed to publish assets'),
                });
              } catch (e) {
                console.error(e);
                showError('Error publishing assets');
              }
            }}
            onCustomize={(themeId) => router.visit(ROUTE.themes.customizer(themeId))}
            onView={(themeId) => router.visit(ROUTE.themes.show(themeId))}
          />

          <InstalledThemesGrid
            items={installedThemesArr as any}
            activeSlug={(activeTheme as any)?.slug}
            canActivate={can('activate themes')}
            canPublishAssets={can('publish theme assets')}
            canCustomize={can('customize themes')}
            canDelete={can('delete themes')}
            onView={(id) => router.visit(ROUTE.themes.show(id))}
            onActivate={async (slug) => {
              try {
                await router.post(ROUTE.themes.activate(slug), {}, {
                  preserveScroll: true,
                  onSuccess: () => {
                    showSuccess('Theme activated');
                    router.reload({ only: ['themes', 'activeTheme'] });
                  },
                  onError: () => showError('Failed to activate theme'),
                });
              } catch (e) {
                console.error(e);
                showError('Error activating theme');
              }
            }}
            onPublishAssets={async (id) => {
              try {
                await router.post(ROUTE.themes.publishAssets(id), {}, {
                  preserveScroll: true,
                  onSuccess: () => showSuccess('Assets published'),
                  onError: () => showError('Failed to publish assets'),
                });
              } catch (e) {
                console.error(e);
                showError('Error publishing theme assets');
              }
            }}
            onCustomize={(id) => router.visit(ROUTE.themes.customizer(id))}
            onUninstall={async (id, displayName) => {
              if (!confirm(`Uninstall theme "${displayName}"? This will remove it from the database.`)) return;
              try {
                await router.delete(ROUTE.themes.destroy(id), {
                  preserveScroll: true,
                  onSuccess: () => {
                    showSuccess('Theme uninstalled');
                    router.reload({ only: ['themes', 'discoveredThemes'] });
                  },
                  onError: () => showError('Failed to uninstall theme'),
                });
              } catch (e) {
                console.error(e);
                showError('Error uninstalling theme');
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
      title="Theme Details"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.themes.index())}>
          Back to Themes
        </Button>
      }
    >
      <ThemeDetails
        theme={theme as any}
        canActivate={can('activate themes')}
        canPublishAssets={can('publish theme assets')}
        canCustomize={can('customize themes')}
        onActivate={async (slug) => {
          try {
            await router.post(ROUTE.themes.activate(slug), {}, {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess('Theme activated');
                router.reload({ only: ['themes', 'activeTheme'] });
              },
              onError: () => showError('Failed to activate theme'),
            });
          } catch (e) {
            console.error(e);
            showError('Error activating theme');
          }
        }}
        onPublishAssets={async (id) => {
          try {
            await router.post(ROUTE.themes.publishAssets(id), {}, {
              preserveScroll: true,
              onSuccess: () => showSuccess('Assets published'),
              onError: () => showError('Failed to publish assets'),
            });
          } catch (e) {
            console.error(e);
            showError('Error publishing assets');
          }
        }}
        onCustomize={(id) => router.visit(ROUTE.themes.customizer(id))}
        onUninstall={async (id, displayName) => {
          if (!confirm(`Uninstall theme "${displayName}"? This will remove it from the database.`)) return;
          try {
            await router.delete(ROUTE.themes.destroy(id), {
              preserveScroll: true,
              onSuccess: () => {
                showSuccess('Theme uninstalled');
                router.reload({ only: ['themes', 'discoveredThemes'] });
              },
              onError: () => showError('Failed to uninstall theme'),
            });
          } catch (e) {
            console.error(e);
            showError('Error uninstalling theme');
          }
        }}
      />
    </SectionWrapper>
  );

  const renderThemeCustomizer = () => (
    <SectionWrapper
      title="Theme Customizer"
      actions={
        <Button variant="outline" size="sm" onClick={() => router.visit(ROUTE.themes.index())}>
          Back to Themes
        </Button>
      }
    >
      <ThemeCustomizerForm
        theme={theme as any}
        settings={(customizerSettings as any) || {}}
        availableMenus={(availableMenus as any) || {}}
        widgetAreas={(widgetAreas as any) || {}}
        initial={typeof (theme as any)?.customizer === 'object' && (theme as any)?.customizer ? (theme as any).customizer : {}}
        onSave={async (data) => {
          try {
            await router.put(ROUTE.themes.update((theme as any)?.id), { customizer: data }, {
              preserveScroll: true,
              onSuccess: () => showSuccess('Customizer saved'),
              onError: () => showError('Failed to save customizer'),
            });
          } catch (err) {
            console.error(err);
            showError('Error saving customizer');
          }
        }}
      />
    </SectionWrapper>
  );

  return {
    themes: renderThemesMain,
    'themes.show': renderThemeDetails,
    'themes.customizer': renderThemeCustomizer,
  };
}
