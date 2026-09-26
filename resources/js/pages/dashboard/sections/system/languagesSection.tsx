import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from '@/hooks/useTranslation';
import { router, useForm } from '@inertiajs/react';
import { Star, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

interface Language {
    id: number;
    code: string;
    name: string;
    native_name: string | null;
    direction: 'ltr' | 'rtl';
    is_active: boolean;
    is_default: boolean;
    translations: number;
}

interface CommonLanguage {
    code: string;
    name: string;
    native_name: string;
    direction: 'ltr' | 'rtl';
}

export interface LanguagesProps {
    items: Language[];
    common: CommonLanguage[];
}

const CUSTOM = '__custom';

/**
 * Administration -> Languages: which languages content can be written in,
 * which are live, and which one visitors get by default.
 */
export function LanguagesPage({ data }: { data: LanguagesProps }) {
    const { t } = useTranslation();
    const taken = new Set(data.items.map((language) => language.code));
    const available = data.common.filter((language) => !taken.has(language.code));
    const form = useForm({ preset: '', code: '', name: '', native_name: '', direction: 'ltr' as 'ltr' | 'rtl' });

    const pick = (code: string) => {
        const preset = data.common.find((language) => language.code === code);
        form.setData(
            preset
                ? { preset: code, code: preset.code, name: preset.name, native_name: preset.native_name, direction: preset.direction }
                : { preset: CUSTOM, code: '', name: '', native_name: '', direction: 'ltr' },
        );
    };

    const add = (e: FormEvent) => {
        e.preventDefault();
        form.transform(({ preset: _preset, ...values }) => values);
        form.post(route('dashboard.admin.languages.store'), { preserveScroll: true, onSuccess: () => form.reset() });
    };

    const update = (language: Language, values: { is_active?: boolean; is_default?: boolean }) =>
        router.put(route('dashboard.admin.languages.update', language.id), values, { preserveScroll: true });

    return (
        <SectionWrapper title={t('dashboard.languages.title')} description={t('dashboard.languages.description')}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Card className="gap-0 py-0">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('dashboard.languages.table.language')}</TableHead>
                                    <TableHead>{t('dashboard.languages.table.code')}</TableHead>
                                    <TableHead>{t('dashboard.languages.table.content')}</TableHead>
                                    <TableHead>{t('dashboard.languages.table.active')}</TableHead>
                                    <TableHead className="text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.items.map((language) => (
                                    <TableRow key={language.id}>
                                        <TableCell>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-medium">{language.native_name || language.name}</span>
                                                {language.native_name && language.native_name !== language.name && (
                                                    <span className="text-xs text-muted-foreground">{language.name}</span>
                                                )}
                                                {language.is_default && <Badge>{t('dashboard.languages.default')}</Badge>}
                                                {language.direction === 'rtl' && <Badge variant="outline">RTL</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{language.code}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground tabular-nums">
                                            {t('dashboard.languages.translations', { count: language.translations })}
                                        </TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={language.is_active}
                                                disabled={language.is_default}
                                                aria-label={t('dashboard.languages.table.active')}
                                                onCheckedChange={(checked) => update(language, { is_active: checked })}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right whitespace-nowrap">
                                            {!language.is_default && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (window.confirm(t('dashboard.languages.confirm_default', { name: language.name })))
                                                            update(language, { is_default: true });
                                                    }}
                                                >
                                                    <Star className="h-4 w-4" />
                                                    {t('dashboard.languages.make_default')}
                                                </Button>
                                            )}
                                            {!language.is_default && language.translations === 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    aria-label={t('dashboard.languages.remove')}
                                                    title={t('dashboard.languages.remove')}
                                                    onClick={() => {
                                                        if (window.confirm(t('dashboard.languages.confirm_remove', { name: language.name })))
                                                            router.delete(route('dashboard.admin.languages.destroy', language.id), {
                                                                preserveScroll: true,
                                                            });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="gap-4">
                    <CardHeader>
                        <CardTitle className="text-base">{t('dashboard.languages.add_title')}</CardTitle>
                        <CardDescription>{t('dashboard.languages.add_description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={add} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>{t('dashboard.languages.fields.language')}</Label>
                                <Select value={form.data.preset || undefined} onValueChange={pick}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('dashboard.languages.choose')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {available.map((language) => (
                                            <SelectItem key={language.code} value={language.code}>
                                                {language.native_name} — {language.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value={CUSTOM}>{t('dashboard.languages.custom')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {form.data.preset === CUSTOM && (
                                <>
                                    <div className="grid grid-cols-[6rem_1fr] gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="language-code">{t('dashboard.languages.fields.code')}</Label>
                                            <Input
                                                id="language-code"
                                                value={form.data.code}
                                                onChange={(e) => form.setData('code', e.target.value)}
                                                placeholder="pt-BR"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="language-name">{t('dashboard.languages.fields.name')}</Label>
                                            <Input id="language-name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="language-native">{t('dashboard.languages.fields.native_name')}</Label>
                                        <Input
                                            id="language-native"
                                            value={form.data.native_name}
                                            onChange={(e) => form.setData('native_name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{t('dashboard.languages.fields.direction')}</Label>
                                        <Select
                                            value={form.data.direction}
                                            onValueChange={(direction) => form.setData('direction', direction as 'ltr' | 'rtl')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ltr">{t('dashboard.languages.ltr')}</SelectItem>
                                                <SelectItem value="rtl">{t('dashboard.languages.rtl')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                            <InputError message={form.errors.code || form.errors.name} />
                            <Button type="submit" className="w-full" disabled={form.processing || !form.data.code || !form.data.name}>
                                {t('dashboard.languages.add')}
                            </Button>
                            <p className="text-xs text-muted-foreground">{t('dashboard.languages.add_hint')}</p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </SectionWrapper>
    );
}
