import { useAdminToast } from '@/components/admin/AdminToastProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { router, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Cpu, Save } from 'lucide-react';
import { useState } from 'react';
import { ROUTE } from '../../routes';
import type { CustomFieldDefinition } from '../../types';
import { CustomFieldInputs } from '../posts/CustomFieldInputs';

interface Plugin {
    id: number;
    name: string;
    slug: string;
    version: string;
    description: string | null;
    settings: Record<string, any> | null;
    is_active: boolean;
}

interface PluginSettingsFormProps {
    plugin: Plugin;
    canEdit: boolean;
    /** The form the plugin describes in plugin.json (settings_schema) */
    schema?: CustomFieldDefinition[];
}

export function PluginSettingsForm({ plugin, canEdit, schema = [] }: PluginSettingsFormProps) {
    const errors = (usePage().props.errors ?? {}) as Record<string, string>;
    const { t } = useTranslation();
    const { success: showSuccess, error: showError } = useAdminToast();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Record<string, any>>(plugin.settings || {});

    const handleChange = (key: string, value: any) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = () => {
        if (!canEdit) return;
        setSaving(true);

        router.put(
            ROUTE.plugins.updateSettings(plugin.slug),
            { settings },
            {
                preserveScroll: true,
                onSuccess: () => {
                    showSuccess(t('dashboard.plugins.settings.messages.updated'));
                    setSaving(false);
                },
                onError: () => {
                    showError(t('dashboard.plugins.settings.messages.update_failed'));
                    setSaving(false);
                },
            },
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.visit(ROUTE.plugins.index())}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.plugins.settings.title', { name: plugin.name })}</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.plugins.settings.configuration_title')}</CardTitle>
                            <CardDescription>{t('dashboard.plugins.settings.configuration_description', { name: plugin.name })}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {schema.length > 0 ? (
                                <CustomFieldInputs
                                    fields={schema}
                                    values={settings}
                                    onChange={setSettings}
                                    errors={errors}
                                    errorPrefix="settings."
                                />
                            ) : Object.keys(settings).length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-6 text-center">
                                    <Cpu className="mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">{t('dashboard.plugins.settings.no_settings')}</p>
                                </div>
                            ) : (
                                Object.entries(settings).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={key} className="capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </Label>
                                        <Input
                                            id={key}
                                            value={typeof value === 'string' ? value : JSON.stringify(value)}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                            disabled={!canEdit}
                                        />
                                    </div>
                                ))
                            )}
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button onClick={handleSave} disabled={saving || !canEdit || (schema.length === 0 && Object.keys(settings).length === 0)} className="gap-2">
                                {saving ? (
                                    t('dashboard.plugins.settings.actions.saving')
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {t('dashboard.plugins.settings.actions.save')}
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('dashboard.plugins.settings.info_title')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between border-b py-1">
                                <span className="text-muted-foreground">{t('dashboard.plugins.settings.labels.version')}</span>
                                <span className="font-medium">{plugin.version}</span>
                            </div>
                            <div className="flex justify-between border-b py-1">
                                <span className="text-muted-foreground">{t('dashboard.plugins.settings.labels.status')}</span>
                                <span className={`font-medium ${plugin.is_active ? 'text-success' : 'text-warning-foreground dark:text-warning'}`}>
                                    {plugin.is_active
                                        ? t('dashboard.plugins.settings.labels.active')
                                        : t('dashboard.plugins.settings.labels.inactive')}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">{t('dashboard.plugins.settings.labels.slug')}</span>
                                <code className="rounded bg-muted px-1 text-xs">{plugin.slug}</code>
                            </div>
                        </CardContent>
                    </Card>

                    {!plugin.is_active && (
                        <Card className="border-warning/40 bg-warning/10">
                            <CardContent className="pt-6">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 shrink-0 text-warning-foreground dark:text-warning" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {t('dashboard.plugins.settings.inactive.title')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('dashboard.plugins.settings.inactive.description')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
