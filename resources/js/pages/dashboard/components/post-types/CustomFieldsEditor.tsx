import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { CUSTOM_FIELD_TYPES, type CustomFieldDefinition, type CustomFieldType } from '../../types';

/** A key a theme can use: lowercase, digits and underscores, starting with a letter. */
const toKey = (label: string) =>
    label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^[^a-z]+|_+$/g, '')
        .slice(0, 40);

/**
 * Defines the extra fields posts of a type get, e.g. "Price" or "Event date".
 * Keys are how themes read the values, so they are fixed once saved.
 */
export function CustomFieldsEditor({
    fields,
    onChange,
    savedKeys,
    errors = {},
}: {
    fields: CustomFieldDefinition[];
    onChange: (fields: CustomFieldDefinition[]) => void;
    savedKeys: string[];
    errors?: Record<string, string>;
}) {
    const { t } = useTranslation();
    const update = (index: number, patch: Partial<CustomFieldDefinition>) =>
        onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
    const move = (index: number, by: number) => {
        const next = [...fields];
        const [field] = next.splice(index, 1);
        next.splice(index + by, 0, field);
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div>
                <div className="text-sm font-medium">{t('dashboard.post_types.fields.title')}</div>
                <p className="text-xs text-muted-foreground">{t('dashboard.post_types.fields.description')}</p>
            </div>

            {fields.length === 0 && (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{t('dashboard.post_types.fields.empty')}</p>
            )}

            {fields.map((field, index) => {
                const keyLocked = savedKeys.includes(field.key) && field.key !== '';
                const error = (name: string) => errors[`fields.${index}.${name}`];
                return (
                    <div key={index} className="space-y-3 rounded-md border p-3">
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_10rem_auto]">
                            <div className="space-y-1">
                                <Label htmlFor={`field-label-${index}`}>{t('dashboard.post_types.fields.label')}</Label>
                                <Input
                                    id={`field-label-${index}`}
                                    value={field.label}
                                    onChange={(e) =>
                                        update(index, {
                                            label: e.target.value,
                                            ...(keyLocked || field.keyTouched ? {} : { key: toKey(e.target.value) }),
                                        })
                                    }
                                    required
                                />
                                {error('label') && <p className="text-xs text-destructive">{error('label')}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor={`field-key-${index}`}>{t('dashboard.post_types.fields.key')}</Label>
                                <Input
                                    id={`field-key-${index}`}
                                    value={field.key}
                                    className="font-mono text-xs"
                                    disabled={keyLocked}
                                    title={keyLocked ? t('dashboard.post_types.fields.key_locked') : undefined}
                                    onChange={(e) => update(index, { key: toKey(e.target.value), keyTouched: true })}
                                    required
                                />
                                {error('key') && <p className="text-xs text-destructive">{error('key')}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label>{t('dashboard.post_types.fields.type')}</Label>
                                <Select value={field.type} onValueChange={(type) => update(index, { type: type as CustomFieldType })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CUSTOM_FIELD_TYPES.map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {t(`dashboard.post_types.fields.types.${type}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end gap-1">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t('dashboard.menus.actions.move_up')}
                                    disabled={index === 0}
                                    onClick={() => move(index, -1)}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label={t('dashboard.menus.actions.move_down')}
                                    disabled={index === fields.length - 1}
                                    onClick={() => move(index, 1)}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    aria-label={t('dashboard.post_types.fields.remove')}
                                    onClick={() => onChange(fields.filter((_, i) => i !== index))}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {field.type === 'select' && (
                            <div className="space-y-1">
                                <Label htmlFor={`field-options-${index}`}>{t('dashboard.post_types.fields.options')}</Label>
                                <Input
                                    id={`field-options-${index}`}
                                    value={(field.options ?? []).join(', ')}
                                    onChange={(e) => update(index, { options: e.target.value.split(',').map((option) => option.trim()) })}
                                    placeholder={t('dashboard.post_types.fields.options_placeholder')}
                                />
                            </div>
                        )}

                        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                            <Input
                                aria-label={t('dashboard.post_types.fields.help')}
                                value={field.help ?? ''}
                                onChange={(e) => update(index, { help: e.target.value })}
                                placeholder={t('dashboard.post_types.fields.help')}
                            />
                            {field.type !== 'toggle' && (
                                <label className="flex items-center gap-2 text-sm">
                                    <Switch checked={Boolean(field.required)} onCheckedChange={(checked) => update(index, { required: checked })} />
                                    {t('dashboard.post_types.fields.required')}
                                </label>
                            )}
                        </div>
                    </div>
                );
            })}

            <Button type="button" variant="outline" size="sm" onClick={() => onChange([...fields, { key: '', label: '', type: 'text' }])}>
                <Plus className="h-4 w-4" />
                {t('dashboard.post_types.fields.add')}
            </Button>
        </div>
    );
}
