import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import { ImageIcon, X } from 'lucide-react';
import { useState } from 'react';
import type { CustomFieldDefinition } from '../../types';
import MediaPickerDialog from '../media/MediaPickerDialog';

export type CustomFieldValues = Record<string, string | number | boolean | null>;

const NONE = '__none';

/**
 * The inputs for a post type's custom fields, in the order they were defined.
 */
export function CustomFieldInputs({
    fields,
    values,
    onChange,
    errors = {},
}: {
    fields: CustomFieldDefinition[];
    values: CustomFieldValues;
    onChange: (values: CustomFieldValues) => void;
    errors?: Record<string, string>;
}) {
    const { t } = useTranslation();
    const [pickerFor, setPickerFor] = useState<string | null>(null);
    const set = (key: string, value: string | number | boolean | null) => onChange({ ...values, [key]: value });
    const text = (key: string) => (values[key] === null || values[key] === undefined ? '' : String(values[key]));

    return (
        <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => {
                const id = `field-${field.key}`;
                const error = errors[`meta_data.fields.${field.key}`];
                const wide = field.type === 'textarea' || field.type === 'image';

                return (
                    <div key={field.key} className={wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
                        {field.type === 'toggle' ? (
                            <div className="flex items-center gap-3 pt-6">
                                <Switch id={id} checked={Boolean(values[field.key])} onCheckedChange={(checked) => set(field.key, checked)} />
                                <Label htmlFor={id}>{field.label}</Label>
                            </div>
                        ) : (
                            <Label htmlFor={id} className="text-sm font-bold">
                                {field.label}
                                {field.required && <span className="text-destructive"> *</span>}
                            </Label>
                        )}

                        {field.type === 'textarea' && (
                            <Textarea id={id} rows={4} value={text(field.key)} onChange={(e) => set(field.key, e.target.value)} required={field.required} />
                        )}
                        {(field.type === 'text' || field.type === 'url' || field.type === 'email' || field.type === 'number' || field.type === 'date') && (
                            <Input
                                id={id}
                                type={field.type === 'text' ? 'text' : field.type}
                                step={field.type === 'number' ? 'any' : undefined}
                                value={text(field.key)}
                                onChange={(e) => set(field.key, e.target.value)}
                                placeholder={field.type === 'url' ? 'https://…' : undefined}
                                required={field.required}
                            />
                        )}
                        {field.type === 'select' && (
                            <Select value={text(field.key) || NONE} onValueChange={(value) => set(field.key, value === NONE ? null : value)}>
                                <SelectTrigger id={id}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {!field.required && <SelectItem value={NONE}>{t('dashboard.post_types.fields.none')}</SelectItem>}
                                    {(field.options ?? []).map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {field.type === 'image' && (
                            <div className="flex items-center gap-4">
                                {values[field.key] ? (
                                    <div className="relative">
                                        <img src={text(field.key)} alt="" className="h-20 w-20 rounded-md object-cover ring-1 ring-border" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                                            aria-label={t('dashboard.settings.remove')}
                                            onClick={() => set(field.key, null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                                    </div>
                                )}
                                <Button type="button" variant="outline" size="sm" onClick={() => setPickerFor(field.key)}>
                                    {t('dashboard.settings.choose')}
                                </Button>
                            </div>
                        )}

                        {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
                        {error && <p className="text-xs text-destructive">{error}</p>}
                    </div>
                );
            })}

            <MediaPickerDialog
                open={pickerFor !== null}
                onOpenChange={(open) => !open && setPickerFor(null)}
                onSelect={(item) => {
                    if (pickerFor) set(pickerFor, item.url);
                    setPickerFor(null);
                }}
            />
        </div>
    );
}
