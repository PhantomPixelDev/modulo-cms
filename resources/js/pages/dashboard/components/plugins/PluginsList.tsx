import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { router } from '@inertiajs/react';
import { Info, Package, Settings, Trash2, User } from 'lucide-react';
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
}

interface PluginsListProps {
    plugins: Plugin[];
    canEdit: boolean;
}

export function PluginsList({ plugins = [], canEdit }: PluginsListProps) {
    const { t } = useTranslation();
    const { success: showSuccess, error: showError } = useAdminToast();

    const togglePlugin = (slug: string, isActive: boolean) => {
        if (!canEdit) return;

        const route = isActive ? ROUTE.plugins.deactivate(slug) : ROUTE.plugins.activate(slug);

        router.post(
            route,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(t(isActive ? 'dashboard.plugins.messages.deactivated' : 'dashboard.plugins.messages.activated'));
                },
                onError: () => {
                    showError(t(isActive ? 'dashboard.plugins.messages.deactivate_failed' : 'dashboard.plugins.messages.activate_failed'));
                },
            },
        );
    };

    const uninstallPlugin = (slug: string, name: string) => {
        if (!canEdit || !confirm(t('dashboard.plugins.confirm_uninstall', { name }))) return;

        router.delete(ROUTE.plugins.destroy(slug), {
            preserveScroll: true,
            onSuccess: () => {
                showSuccess(t('dashboard.plugins.messages.uninstalled', { name }));
            },
            onError: () => {
                showError(t('dashboard.plugins.messages.uninstall_failed', { name }));
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
                                disabled={!canEdit}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow pb-4">
                        <p className="line-clamp-3 text-sm text-muted-foreground">{plugin.description || t('dashboard.plugins.no_description')}</p>
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
                                onClick={() => uninstallPlugin(plugin.slug, plugin.name)}
                                disabled={!canEdit}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('dashboard.plugins.actions.uninstall')}
                            </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                            <Info className="mr-1 h-3.5 w-3.5" />
                            {t('dashboard.plugins.actions.details')}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
