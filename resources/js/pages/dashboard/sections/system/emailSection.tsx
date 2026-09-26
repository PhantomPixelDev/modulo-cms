import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { useForm, usePage } from '@inertiajs/react';
import { Info, Loader2, Send } from 'lucide-react';
import type { FormEvent } from 'react';
import { SectionWrapper } from '../../components/common/SectionWrapper';

export interface MailSettingsData {
    mode: 'env' | 'smtp' | 'log';
    host: string;
    port: number;
    security: 'starttls' | 'ssl';
    username: string;
    has_password: boolean;
    from_address: string;
    from_name: string;
    env_mailer: string;
}

/**
 * System -> Email: where the site's mail goes (order confirmations, password
 * resets, contact messages) and a test message to check it.
 */
export function EmailPage({ data }: { data: MailSettingsData }) {
    const { t } = useTranslation();
    const user = (usePage().props as unknown as { auth?: { user?: { email?: string } } }).auth?.user;
    const form = useForm({
        mode: data.mode,
        host: data.host,
        port: data.port,
        security: data.security,
        username: data.username,
        password: '',
        forget_password: false,
        from_address: data.from_address,
        from_name: data.from_name,
    });
    const test = useForm({ to: user?.email ?? '' });

    const save = (e: FormEvent) => {
        e.preventDefault();
        form.put(route('dashboard.admin.system.email.update'), { preserveScroll: true, onSuccess: () => form.setData('password', '') });
    };

    const smtp = form.data.mode === 'smtp';

    return (
        <SectionWrapper title={t('dashboard.email.title')} description={t('dashboard.email.description')}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t('dashboard.email.settings_title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={save} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label>{t('dashboard.email.fields.mode')}</Label>
                                <Select value={form.data.mode} onValueChange={(mode) => form.setData('mode', mode as MailSettingsData['mode'])}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="smtp">{t('dashboard.email.modes.smtp')}</SelectItem>
                                        <SelectItem value="env">{t('dashboard.email.modes.env', { mailer: data.env_mailer })}</SelectItem>
                                        <SelectItem value="log">{t('dashboard.email.modes.log')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">{t(`dashboard.email.mode_hints.${form.data.mode}`)}</p>
                            </div>

                            {smtp && (
                                <div className="grid gap-4 sm:grid-cols-[1fr_8rem_12rem]">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="mail-host">{t('dashboard.email.fields.host')}</Label>
                                        <Input
                                            id="mail-host"
                                            value={form.data.host}
                                            onChange={(e) => form.setData('host', e.target.value)}
                                            placeholder="smtp.example.com"
                                        />
                                        <InputError message={form.errors.host} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="mail-port">{t('dashboard.email.fields.port')}</Label>
                                        <Input
                                            id="mail-port"
                                            type="number"
                                            value={form.data.port}
                                            onChange={(e) => form.setData('port', Number(e.target.value))}
                                        />
                                        <InputError message={form.errors.port} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>{t('dashboard.email.fields.security')}</Label>
                                        <Select
                                            value={form.data.security}
                                            onValueChange={(security) => {
                                                form.setData((current) => ({
                                                    ...current,
                                                    security: security as MailSettingsData['security'],
                                                    // The usual port for each, unless one was typed
                                                    port:
                                                        current.port === 587 || current.port === 465
                                                            ? security === 'ssl'
                                                                ? 465
                                                                : 587
                                                            : current.port,
                                                }));
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="starttls">{t('dashboard.email.security.starttls')}</SelectItem>
                                                <SelectItem value="ssl">{t('dashboard.email.security.ssl')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="mail-username">{t('dashboard.email.fields.username')}</Label>
                                        <Input
                                            id="mail-username"
                                            value={form.data.username}
                                            onChange={(e) => form.setData('username', e.target.value)}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="mail-password">{t('dashboard.email.fields.password')}</Label>
                                        <Input
                                            id="mail-password"
                                            type="password"
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            placeholder={data.has_password ? t('dashboard.email.password_saved') : ''}
                                            autoComplete="new-password"
                                        />
                                        <p className="text-xs text-muted-foreground">{t('dashboard.email.password_hint')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="mail-from">{t('dashboard.email.fields.from_address')}</Label>
                                    <Input
                                        id="mail-from"
                                        type="email"
                                        value={form.data.from_address}
                                        onChange={(e) => form.setData('from_address', e.target.value)}
                                        placeholder="shop@example.com"
                                    />
                                    <InputError message={form.errors.from_address} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="mail-from-name">{t('dashboard.email.fields.from_name')}</Label>
                                    <Input
                                        id="mail-from-name"
                                        value={form.data.from_name}
                                        onChange={(e) => form.setData('from_name', e.target.value)}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.email.from_hint')}</p>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={form.processing}>
                                    {form.processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {t('dashboard.email.save')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('dashboard.email.test_title')}</CardTitle>
                            <CardDescription>{t('dashboard.email.test_description')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="space-y-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    test.post(route('dashboard.admin.system.email.test'), { preserveScroll: true });
                                }}
                            >
                                <Input
                                    type="email"
                                    aria-label={t('dashboard.email.test_to')}
                                    value={test.data.to}
                                    onChange={(e) => test.setData('to', e.target.value)}
                                    required
                                />
                                <InputError message={test.errors.to} />
                                <Button type="submit" variant="outline" className="w-full" disabled={test.processing || form.isDirty}>
                                    {test.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    {t('dashboard.email.test_send')}
                                </Button>
                                {form.isDirty && <p className="text-xs text-muted-foreground">{t('dashboard.email.test_save_first')}</p>}
                            </form>
                        </CardContent>
                    </Card>

                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>{t('dashboard.email.provider_hint')}</AlertDescription>
                    </Alert>
                </div>
            </div>
        </SectionWrapper>
    );
}
