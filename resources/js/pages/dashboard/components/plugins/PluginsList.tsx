import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { router } from '@inertiajs/react';
import { AlertTriangle, Link2, Package, Settings, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { ROUTE } from '../../routes';

interface Plugin {
    id: number;
    name: string;
    slug: string;
    version: string;
    description: string | null;
    author: string | null;
    is_active: boolean;
    settings: any;
    installed_at: string | null;
    source?: string | null;
    /** Requirements that stop an inactive plugin from being activated. */
    unmet?: string[];
    /** Active plugins that need this one. */
    dependents?: string[];
}

interface PluginsListProps {
    plugins: Plugin[];
    canEdit: boolean;
}

export function PluginsList({ plugins = [], canEdit }: PluginsListProps) {
    const { t } = useTranslation();
    const { error: showError } = useAdminToast();
    const [uninstalling, setUninstalling] = useState<Plugin | null>(null);
    const [deleteData, setDeleteData] = useState(false);

    // The server's flash message says whether it worked (and why not), so no
    // optimistic "activated" toast here.
    const togglePlugin = (slug: string, isActive: boolean) => {
        if (!canEdit) return;

        router.post(
            isActive ? ROUTE.plugins.deactivate(slug) : ROUTE.plugins.activate(slug),
            {},
            {
                preserveScroll: true,
                onError: () => showError(t(isActive ? 'dashboard.plugins.messages.deactivate_failed' : 'dashboard.plugins.messages.activate_failed')),
            },
        );
    };

    const confirmUninstall = () => {
        if (!uninstalling) return;

        router.delete(ROUTE.plugins.destroy(uninstalling.slug), {
            data: { delete_data: deleteData },
            preserveScroll: true,
            onError: () => showError(t('dashboard.plugins.messages.uninstall_failed', { name: uninstalling.name })),
            onFinish: () => {
                setUninstalling(null);
                setDeleteData(false);
            },
        });
    };

    if (plugins.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <Package className="mb-4 h-10 w-10 text-muted-foreground" />
                    <CardTitle className="mb-2">{t('dashboard.plugins.empty.title')}</CardTitle>
                    <CardDescription>{t('dashboard.plugins.empty.description')}</CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plugins.map((plugin) => (
                    <Card key={plugin.slug} className={`flex flex-col ${plugin.is_active ? 'border-primary/20 bg-primary/5' : ''}`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        {plugin.name}
                                        {plugin.is_active && (
                                            <Badge variant="default" className="h-4 border-none bg-primary/20 text-[10px] text-primary">
                                                {t('dashboard.plugins.badges.active')}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 text-xs">
                                        <span className="font-medium text-foreground/70">
                                            {t('dashboard.plugins.version', { version: plugin.version })}
                                        </span>
                                        {plugin.author && (
                                            <>
                                                <span className="text-muted-foreground">•</span>
                                                <span className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {plugin.author}
                                                </span>
                                            </>
                                        )}
                                    </CardDescription>
                                </div>
                                <Switch
                                    checked={plugin.is_active}
                                    onCheckedChange={() => togglePlugin(plugin.slug, plugin.is_active)}
                                    disabled={
                                        !canEdit ||
                                        (!plugin.is_active && (plugin.unmet?.length ?? 0) > 0) ||
                                        (plugin.is_active && (plugin.dependents?.length ?? 0) > 0)
                                    }
                                    aria-label={plugin.is_active ? `Deactivate ${plugin.name}` : `Activate ${plugin.name}`}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow pb-4">
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                                {plugin.description || t('dashboard.plugins.no_description')}
                            </p>
                            {!plugin.is_active && (plugin.unmet?.length ?? 0) > 0 && (
                                <p className="mt-3 flex gap-2 rounded-md bg-warning/10 p-2 text-xs text-warning-foreground dark:text-warning">
                                    <AlertTriangle className="size-3.5 shrink-0" />
                                    <span>Needs {plugin.unmet!.join(', ')}.</span>
                                </p>
                            )}
                            {plugin.is_active && (plugin.dependents?.length ?? 0) > 0 && (
                                <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
                                    <Link2 className="size-3.5 shrink-0" />
                                    <span>Required by {plugin.dependents!.join(', ')}.</span>
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between gap-2 pt-0">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    disabled={!plugin.is_active}
                                    onClick={() => router.visit(ROUTE.plugins.settings(plugin.slug))}
                                >
                                    <Settings className="h-3.5 w-3.5" />
                                    {t('dashboard.plugins.actions.settings')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive"
                                    onClick={() => setUninstalling(plugin)}
                                    disabled={!canEdit || (plugin.dependents?.length ?? 0) > 0}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t('dashboard.plugins.actions.uninstall')}
                                </Button>
                            </div>
                            {plugin.source === 'registry' && (
                                <Badge variant="outline" className="text-[10px]">
                                    Registry
                                </Badge>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <Dialog open={uninstalling !== null} onOpenChange={(open) => !open && setUninstalling(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Uninstall {uninstalling?.name}?</DialogTitle>
                        <DialogDescription>
                            The plugin is switched off and removed from this list. Its files stay on disk, so Scan for plugins brings it back.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-start gap-3 rounded-md border p-3">
                        <Checkbox id="delete-plugin-data" checked={deleteData} onCheckedChange={(checked) => setDeleteData(checked === true)} />
                        <div className="space-y-1">
                            <Label htmlFor="delete-plugin-data">Also delete its data</Label>
                            <p className="text-xs text-muted-foreground">
                                Drops the tables the plugin created, with everything in them. This cannot be undone.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUninstalling(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmUninstall}>
                            {deleteData ? 'Uninstall and delete data' : 'Uninstall'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
