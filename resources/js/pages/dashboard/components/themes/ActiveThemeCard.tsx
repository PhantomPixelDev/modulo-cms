import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

export interface ActiveThemeCardProps {
    activeTheme?: any | null;
    canPublishAssets?: boolean;
    onPublishAssets?: (themeId: number) => void;
    onView?: (themeId: number) => void;
    canCustomize?: boolean;
    onCustomize?: (themeId: number) => void;
}

export function ActiveThemeCard({
    activeTheme,
    canPublishAssets = false,
    onPublishAssets,
    onView,
    canCustomize = false,
    onCustomize,
}: ActiveThemeCardProps) {
    const { t } = useTranslation();
    return (
        <div>
            <h3 className="mb-3 font-semibold">Active Theme</h3>
            <div className="rounded-md border p-4">
                {activeTheme ? (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                            {(() => {
                                const cfg = activeTheme?.config || {};
                                const previewPath = cfg.preview || cfg.screenshot;
                                return previewPath ? (
                                    <img
                                        src={`/themes/${activeTheme.slug}/${previewPath}`}
                                        alt={activeTheme.name || activeTheme.slug}
                                        className="h-14 w-20 rounded border object-cover"
                                    />
                                ) : null;
                            })()}
                            <div>
                                <div className="font-medium">{activeTheme.name || activeTheme.slug}</div>
                                <div className="text-xs text-muted-foreground">Slug: {activeTheme.slug}</div>
                                {(activeTheme?.config?.version || activeTheme?.config?.author) && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        {activeTheme?.config?.version && <span>Version: {activeTheme.config.version}</span>}
                                        {activeTheme?.config?.version && activeTheme?.config?.author && <span> · </span>}
                                        {activeTheme?.config?.author &&
                                            (activeTheme?.config?.author_url ? (
                                                <a className="underline" href={activeTheme.config.author_url} target="_blank" rel="noreferrer">
                                                    {activeTheme.config.author}
                                                </a>
                                            ) : (
                                                <span>{activeTheme.config.author}</span>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {canCustomize && (
                                <Button size="sm" onClick={() => activeTheme?.id && onCustomize?.(activeTheme.id)}>
                                    {t('dashboard.theme_settings.title')}
                                </Button>
                            )}
                            {canPublishAssets && (
                                <Button size="sm" variant="secondary" onClick={() => activeTheme?.id && onPublishAssets?.(activeTheme.id)}>
                                    Publish Assets
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => activeTheme?.id && onView?.(activeTheme.id)}>
                                View
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">No active theme</div>
                )}
            </div>
        </div>
    );
}
