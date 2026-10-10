import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';
import { themeDeclarations, type ThemeSettingsData, type ThemeSettingValues } from '@/theme-settings';
import { useForm } from '@inertiajs/react';
import { useState, type CSSProperties } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

function ThemeSettingsEditor({ settings }: { settings: ThemeSettingsData }) {
    const { t } = useTranslation();
    const form = useForm<{ values: ThemeSettingValues }>({ values: settings.values });
    const { setData } = form;
    const [darkPreview, setDarkPreview] = useState(false);
    const label = (key: string, fallback: string) => t(`dashboard.theme_settings.fields.${key}`, {}, fallback);
    const previewStyle = Object.fromEntries(
        [themeDeclarations(form.data.values), darkPreview ? themeDeclarations(form.data.values, true) : '']
            .join(';')
            .split(';')
            .filter(Boolean)
            .map((entry) => {
                const separator = entry.indexOf(':');
                const key = entry.slice(0, separator);
                return [key === 'font-family' ? 'fontFamily' : key, entry.slice(separator + 1)];
            }),
    ) as CSSProperties;

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                if (!form.processing) form.put(route('dashboard.admin.themes.settings.update', settings.id), { preserveScroll: true });
            }}
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,340px)]"
        >
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                    {settings.name} · {t(`dashboard.theme_settings.${settings.active ? 'active' : 'inactive'}`)}
                </p>
                {(['colors', 'dark_colors', 'layout'] as const).map((group) => {
                    const fields = Object.entries(settings.fields).filter(([, field]) => field.group === group);
                    if (!fields.length) return null;
                    return (
                        <fieldset key={group} disabled={form.processing} className="space-y-4 rounded-lg border p-5">
                            <legend className="px-2 text-sm font-semibold">{t(`dashboard.theme_settings.${group}`)}</legend>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {fields.map(([key, field]) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={`theme-${key}`}>{label(key, field.label)}</Label>
                                        {field.type === 'color' ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    aria-label={`${label(key, field.label)} ${t('dashboard.theme_settings.picker')}`}
                                                    value={
                                                        /^#[0-9a-f]{6}$/i.test(String(form.data.values[key]))
                                                            ? String(form.data.values[key])
                                                            : String(field.default)
                                                    }
                                                    onChange={(event) => setData('values', { ...form.data.values, [key]: event.target.value })}
                                                    className="h-9 w-11 shrink-0 cursor-pointer rounded border bg-transparent p-1"
                                                />
                                                <Input
                                                    id={`theme-${key}`}
                                                    value={String(form.data.values[key] ?? '')}
                                                    maxLength={7}
                                                    onChange={(event) => setData('values', { ...form.data.values, [key]: event.target.value })}
                                                    aria-invalid={Boolean(form.errors[`values.${key}`])}
                                                    className="font-mono"
                                                />
                                            </div>
                                        ) : field.type === 'select' ? (
                                            <select
                                                id={`theme-${key}`}
                                                value={String(form.data.values[key])}
                                                onChange={(event) => setData('values', { ...form.data.values, [key]: event.target.value })}
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            >
                                                {Object.entries(field.options).map(([value, text]) => (
                                                    <option key={value} value={value}>
                                                        {t(`dashboard.theme_settings.options.${value}`, {}, text)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                id={`theme-${key}`}
                                                type="checkbox"
                                                checked={form.data.values[key] === true}
                                                onChange={(event) => setData('values', { ...form.data.values, [key]: event.target.checked })}
                                                className="size-4 accent-primary"
                                            />
                                        )}
                                        {form.errors[`values.${key}`] && (
                                            <p className="text-sm text-destructive" role="alert">
                                                {form.errors[`values.${key}`]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </fieldset>
                    );
                })}
                {form.errors.values && (
                    <p className="text-sm text-destructive" role="alert">
                        {form.errors.values}
                    </p>
                )}
                {!Object.keys(settings.fields).length && <p className="text-sm text-muted-foreground">{t('dashboard.theme_settings.no_controls')}</p>}
                <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={form.processing || !form.isDirty || !Object.keys(settings.fields).length}>
                        {t(`dashboard.theme_settings.${form.processing ? 'saving' : 'save'}`)}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={form.processing}
                        onClick={() => {
                            if (confirm(t('dashboard.theme_settings.reset_confirm')))
                                form.delete(route('dashboard.admin.themes.settings.reset', settings.id), { preserveScroll: true });
                        }}
                    >
                        {t('dashboard.theme_settings.reset')}
                    </Button>
                    <Button type="button" variant="ghost" disabled={form.processing || !form.isDirty} onClick={() => form.reset()}>
                        {t('dashboard.theme_settings.discard')}
                    </Button>
                </div>
            </div>
            <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{t('dashboard.theme_settings.preview')}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDarkPreview(!darkPreview)}>
                        {t(`dashboard.theme_settings.${darkPreview ? 'light_preview' : 'dark_preview'}`)}
                    </Button>
                </div>
                <div
                    data-testid="theme-settings-preview"
                    style={previewStyle}
                    className="theme-frontend overflow-hidden rounded-lg border bg-background text-foreground"
                >
                    <div className="border-b bg-muted px-6 py-4 text-sm font-semibold">{settings.name}</div>
                    <div className="space-y-4 p-6">
                        <div className="h-24 rounded-md bg-muted" />
                        <h3 className="text-xl font-semibold">{t('dashboard.theme_settings.preview_title')}</h3>
                        <p className="text-sm">{t('dashboard.theme_settings.preview_text')}</p>
                        <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                            {t('dashboard.theme_settings.preview_button')}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">{t('dashboard.theme_settings.preview_hint')}</p>
                <a href="/" target="_blank" rel="noreferrer" className="text-sm underline">
                    {t('dashboard.theme_settings.view_site')}
                </a>
            </aside>
        </form>
    );
}

function ThemeSettingsSection({ settings }: { settings?: ThemeSettingsData | null }) {
    const { t } = useTranslation();
    return (
        <SectionWrapper title={t('dashboard.theme_settings.title')} description={t('dashboard.theme_settings.description')}>
            {settings ? (
                <ThemeSettingsEditor key={`${settings.id}:${JSON.stringify(settings.values)}`} settings={settings} />
            ) : (
                <p className="text-muted-foreground">{t('dashboard.theme_settings.no_theme')}</p>
            )}
        </SectionWrapper>
    );
}

export function getThemeSettingsSections({ themeSettings }: { themeSettings?: ThemeSettingsData | null }) {
    return { 'theme-settings': () => <ThemeSettingsSection settings={themeSettings} /> };
}
