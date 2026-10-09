import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { useAcl } from '@/lib/acl';
import { ApiError, apiGet, apiPost } from '@/lib/api';
import type { CatalogPartial } from '@/pages/admin/partials/shortcode';
import MediaPickerDialog from '@/pages/dashboard/components/media/MediaPickerDialog';
import SlateEditor from '@/pages/dashboard/components/posts/SlateEditor';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { partialErrors, partialFields, partialValues, type PartialValue } from './partial-editor';

export function PartialDialog({
    open,
    onOpenChange,
    initial,
    onApply,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: PartialValue;
    onApply?: (value: PartialValue) => void;
}) {
    const { t } = useTranslation();
    const { hasPermission } = useAcl();
    const locale = usePage<{ locale: { current: string } }>().props.locale?.current;
    const id = useId();
    const [catalog, setCatalog] = useState<CatalogPartial[]>([]);
    const [selected, setSelected] = useState<CatalogPartial | null>(null);
    const [attributes, setAttributes] = useState<Record<string, string>>({});
    const [body, setBody] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [mediaField, setMediaField] = useState<string | null>(null);
    const generation = useRef(0);
    const invalidate = useCallback(() => ++generation.current, []);
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        invalidate();
        setCatalog([]);
        setSelected(null);
        setSearch('');
        setPreview('');
        setError('');
        setErrors({});
        setPreviewing(false);
        setLoading(true);
        apiGet<{ partialCatalog: CatalogPartial[] }>('/dashboard/admin/partials')
            .then(({ partialCatalog }) => {
                if (cancelled) return;
                setCatalog(partialCatalog);
                const item = initial ? partialCatalog.find((partial) => partial.name === initial.name) : undefined;
                if (item) {
                    setSelected(item);
                    setAttributes(partialValues(item, initial?.attributes));
                    setBody(initial?.body ?? '');
                } else if (initial) setError(t('dashboard.partials.unavailable'));
            })
            .catch(() => {
                if (!cancelled) setError(t('dashboard.partials.load_failed'));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
            invalidate();
        };
    }, [open, initial, t, invalidate]);

    const changed = () => {
        generation.current++;
        setPreview('');
        setPreviewing(false);
        setError('');
        setErrors({});
    };
    const choose = (partial: CatalogPartial) => {
        changed();
        setSelected(partial);
        setAttributes(partialValues(partial));
        setBody('');
    };
    const update = (name: string, value: string) => {
        changed();
        setAttributes((current) => ({ ...current, [name]: value }));
    };
    const value = selected ? { name: selected.name, attributes, body, hasBody: selected.body } : null;
    const valid = () => {
        if (!selected) return false;
        const fields = partialErrors(selected, attributes, t('dashboard.partials.check_field'));
        setErrors(fields);
        if (body.length > 32768) {
            setError(t('dashboard.partials.body_too_long'));
            return false;
        }
        return Object.keys(fields).length === 0;
    };
    const showPreview = async () => {
        if (!value || !valid()) return;
        const revision = ++generation.current;
        setPreviewing(true);
        setError('');
        setPreview('');
        try {
            const data = await apiPost<{ url: string }>('/dashboard/admin/partials/preview', { name: value.name, attributes, body, locale });
            if (revision === generation.current) setPreview(data.url);
        } catch (failure) {
            if (revision !== generation.current) return;
            setError(t('dashboard.partials.preview_failed'));
            if (failure instanceof ApiError && failure.data.errors) {
                setErrors(
                    Object.fromEntries(
                        Object.entries(failure.data.errors).map(([name, messages]) => [name.replace(/^attributes\./, ''), messages[0]]),
                    ),
                );
            }
        } finally {
            if (revision === generation.current) setPreviewing(false);
        }
    };
    const matches = catalog.filter((partial) =>
        `${partial.name} ${partial.label} ${partial.description}`.toLowerCase().includes(search.toLowerCase()),
    );
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-5xl" onCloseAutoFocus={(event) => event.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>
                        {t(onApply ? (initial ? 'dashboard.partials.edit' : 'dashboard.partials.insert') : 'dashboard.partials.configure')}
                    </DialogTitle>
                    <DialogDescription>{t('dashboard.partials.picker_description')}</DialogDescription>
                </DialogHeader>
                {loading ? (
                    <p role="status">{t('dashboard.partials.loading')}</p>
                ) : (
                    <div className="grid min-w-0 gap-6 md:grid-cols-[200px_minmax(0,1fr)]">
                        <div className="space-y-3">
                            <Input
                                aria-label={t('dashboard.partials.search')}
                                placeholder={t('dashboard.partials.search')}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            {matches.map((partial) => (
                                <Button
                                    key={partial.name}
                                    type="button"
                                    variant={selected?.name === partial.name ? 'secondary' : 'ghost'}
                                    className="h-auto w-full justify-start whitespace-normal"
                                    onClick={() => choose(partial)}
                                >
                                    {partial.label}
                                </Button>
                            ))}
                            {matches.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {t(catalog.length ? 'dashboard.partials.no_results' : 'dashboard.partials.no_partials')}
                                </p>
                            )}
                        </div>
                        {selected && (
                            <div className="min-w-0 space-y-4">
                                <p className="text-sm text-muted-foreground">{selected.description}</p>
                                {partialFields(selected).map((field) => {
                                    const fieldId = `${id}-${field.name}`;
                                    const fieldValue = attributes[field.name] ?? '';
                                    const helpId = `${fieldId}-help`;
                                    return (
                                        <div key={field.name} className="space-y-2">
                                            <Label htmlFor={fieldId}>
                                                {field.label}
                                                {field.required ? ' *' : ''}
                                            </Label>
                                            {field.type === 'select' ? (
                                                <select
                                                    id={fieldId}
                                                    aria-invalid={!!errors[field.name]}
                                                    aria-describedby={helpId}
                                                    value={fieldValue}
                                                    onChange={(event) => update(field.name, event.target.value)}
                                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                                >
                                                    <option value="">{t('dashboard.partials.choose_value')}</option>
                                                    {field.options.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : field.type === 'boolean' ? (
                                                <Switch
                                                    id={fieldId}
                                                    checked={fieldValue === 'true'}
                                                    onCheckedChange={(checked) => update(field.name, String(checked))}
                                                    aria-describedby={helpId}
                                                />
                                            ) : field.type === 'textarea' ? (
                                                <Textarea
                                                    id={fieldId}
                                                    value={fieldValue}
                                                    maxLength={2000}
                                                    onChange={(event) => update(field.name, event.target.value)}
                                                    aria-invalid={!!errors[field.name]}
                                                    aria-describedby={helpId}
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    <Input
                                                        id={fieldId}
                                                        value={fieldValue}
                                                        maxLength={2000}
                                                        onChange={(event) => update(field.name, event.target.value)}
                                                        className="min-w-0 flex-1"
                                                        aria-invalid={!!errors[field.name]}
                                                        aria-describedby={helpId}
                                                    />
                                                    {field.type === 'image' && hasPermission('view media') && (
                                                        <Button type="button" variant="outline" onClick={() => setMediaField(field.name)}>
                                                            {t('dashboard.partials.choose_image')}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <p
                                                id={helpId}
                                                className={errors[field.name] ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
                                            >
                                                {errors[field.name] || field.help}
                                            </p>
                                        </div>
                                    );
                                })}
                                {selected.body && (
                                    <div className="space-y-2">
                                        <Label>{t('dashboard.partials.body_label')}</Label>
                                        <div className="rounded-md border p-3">
                                            <SlateEditor
                                                key={selected.name}
                                                initialHTML={body}
                                                onHTMLChange={(html) => {
                                                    if (html !== body) {
                                                        changed();
                                                        setBody(html);
                                                    }
                                                }}
                                                partialsEnabled={false}
                                            />
                                        </div>
                                    </div>
                                )}
                                <Button type="button" variant="outline" onClick={showPreview} disabled={previewing}>
                                    {t(previewing ? 'dashboard.partials.loading' : 'dashboard.partials.preview')}
                                </Button>
                                {preview && (
                                    <iframe
                                        key={preview}
                                        title={t('dashboard.partials.preview_title')}
                                        src={preview}
                                        sandbox="allow-scripts allow-same-origin"
                                        className="h-[420px] w-full rounded-lg border bg-white"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        {t('dashboard.common.cancel')}
                    </Button>
                    {onApply && (
                        <Button
                            type="button"
                            disabled={!selected || loading || previewing}
                            onClick={() => {
                                if (value && valid()) {
                                    onApply(value);
                                    onOpenChange(false);
                                }
                            }}
                        >
                            {t(initial ? 'dashboard.partials.apply' : 'dashboard.partials.insert')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
            <MediaPickerDialog
                open={mediaField !== null}
                onOpenChange={(next) => {
                    if (!next) setMediaField(null);
                }}
                type="image"
                onSelect={(item) => {
                    if (mediaField && item.url) update(mediaField, item.url);
                    setMediaField(null);
                }}
            />
        </Dialog>
    );
}
