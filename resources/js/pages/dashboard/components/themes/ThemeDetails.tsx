import { Button } from '@/components/ui/button';

interface ThemeDetailsProps {
    theme: any;
    canActivate?: boolean;
    canPublishAssets?: boolean;
    onActivate: (slug: string) => void;
    onPublishAssets: (id: number) => void;
    onUninstall: (id: number, displayName: string) => void;
}

export function ThemeDetails({ theme, canActivate = false, canPublishAssets = false, onActivate, onPublishAssets, onUninstall }: ThemeDetailsProps) {
    const t = theme || {};
    const cfg = t.config || (theme as any)?.config || (theme as any)?.themeConfig || ({} as any);
    const isActive = Boolean(t.is_active);
    const previewPath = cfg.preview || cfg.screenshot || t.screenshot;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                {previewPath ? (
                    <img src={`/themes/${t.slug}/${previewPath}`} alt={t.name || t.slug} className="h-28 w-40 rounded border object-cover" />
                ) : null}
                <div className="space-y-1 text-sm">
                    <div className="text-lg font-semibold">{t.name || t.slug}</div>
                    <div className="text-muted-foreground">Slug: {t.slug}</div>
                    {cfg?.version && <div className="text-muted-foreground">Version: {cfg.version}</div>}
                    {cfg?.author && (
                        <div className="text-muted-foreground">
                            Author:{' '}
                            {cfg.author_url ? (
                                <a href={cfg.author_url} className="underline" target="_blank" rel="noreferrer">
                                    {cfg.author}
                                </a>
                            ) : (
                                cfg.author
                            )}
                        </div>
                    )}
                    {cfg?.description && <div className="text-muted-foreground">{cfg.description}</div>}
                    {isActive && (
                        <div className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Active
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {!isActive && canActivate && (
                    <Button size="sm" onClick={() => onActivate(t.slug)}>
                        Activate
                    </Button>
                )}
                {canPublishAssets && (
                    <Button size="sm" variant="secondary" onClick={() => onPublishAssets(t.id)}>
                        Publish Assets
                    </Button>
                )}
                {!isActive && (
                    <Button size="sm" variant="destructive" onClick={() => onUninstall(t.id, t.name || t.slug)}>
                        Uninstall
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                    <h4 className="mb-2 font-semibold">Features</h4>
                    <div className="text-sm text-muted-foreground">
                        {Array.isArray(t.tags) && t.tags.length > 0 && <div className="mb-2">Tags: {t.tags.join(', ')}</div>}
                        {cfg?.supports && Object.keys(cfg.supports).length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5">
                                {Object.entries(cfg.supports).map(([k, v]: any) => (
                                    <li key={k}>
                                        {k}: {String(v)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>—</div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="mb-2 font-semibold">Menus</h4>
                    <div className="text-sm text-muted-foreground">
                        {cfg?.menus && Object.keys(cfg.menus).length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5">
                                {Object.entries(cfg.menus).map(([k, v]: any) => (
                                    <li key={k}>
                                        <span className="font-medium">{k}</span>: {String(v)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>—</div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="mb-2 font-semibold">Widget Areas</h4>
                    <div className="text-sm text-muted-foreground">
                        {t?.widget_areas && Object.keys(t.widget_areas).length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5">
                                {Object.entries(t.widget_areas).map(([k, v]: any) => (
                                    <li key={k}>
                                        <span className="font-medium">{k}</span>: {String(v)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>—</div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="mb-2 font-semibold">Templates</h4>
                    <div className="text-sm text-muted-foreground">
                        {t?.templates && Object.keys(t.templates).length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5">
                                {Object.entries(t.templates).map(([k, v]: any) => (
                                    <li key={k}>
                                        <span className="font-medium">{k}</span>: {String(v)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div>—</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
