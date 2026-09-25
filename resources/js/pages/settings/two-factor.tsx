import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/pages/dashboard/components/common/SettingsLayout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Copy, ShieldCheck, ShieldOff } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Two-factor authentication', href: '/settings/two-factor' }];

interface Props {
    enabled: boolean;
    pending: boolean;
    setup: { secret: string; uri: string } | null;
    recoveryCodes: string[] | null;
    recoveryCodesLeft: number | null;
    required: boolean;
}

function RecoveryCodes({ codes }: { codes: string[] }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(codes.join('\n'));
            setCopied(true);
        } catch {
            // Clipboard unavailable; the codes are on screen to copy by hand.
        }
    };

    return (
        <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
            <p className="text-sm font-medium">Save these recovery codes somewhere safe. Each one signs you in once if you lose your device.</p>
            <p className="text-xs text-muted-foreground">They are shown only now.</p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
                {codes.map((code) => (
                    <li key={code} className="rounded bg-background px-2 py-1">
                        {code}
                    </li>
                ))}
            </ul>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
                <Copy />
                {copied ? 'Copied' : 'Copy codes'}
            </Button>
        </div>
    );
}

export default function TwoFactor({ enabled, pending, setup, recoveryCodes, recoveryCodesLeft, required }: Props) {
    const confirmForm = useForm({ code: '' });

    const confirm: FormEventHandler = (e) => {
        e.preventDefault();
        confirmForm.post(route('two-factor.confirm'), { preserveScroll: true, onFinish: () => confirmForm.reset() });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two-factor authentication" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Two-factor authentication"
                        description="Ask for a code from an authenticator app (1Password, Google Authenticator, Authy, …) when you sign in."
                    />

                    <div className="flex items-center gap-2">
                        {enabled ? (
                            <Badge variant="success">
                                <ShieldCheck className="size-3.5" /> On
                            </Badge>
                        ) : (
                            <Badge variant="outline">
                                <ShieldOff className="size-3.5" /> Off
                            </Badge>
                        )}
                        {required && <span className="text-sm text-muted-foreground">Required for administrators on this site.</span>}
                    </div>

                    {recoveryCodes && recoveryCodes.length > 0 && <RecoveryCodes codes={recoveryCodes} />}

                    {!enabled && !pending && (
                        <Button onClick={() => router.post(route('two-factor.enable'), {}, { preserveScroll: true })}>
                            Set up two-factor authentication
                        </Button>
                    )}

                    {pending && setup && (
                        <div className="space-y-6 rounded-lg border p-5">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">1. Scan this code with your authenticator app</p>
                                <div className="inline-block rounded-lg bg-white p-3">
                                    <QRCodeSVG value={setup.uri} size={176} marginSize={0} title="Two-factor setup QR code" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Or enter this key by hand:{' '}
                                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono break-all">{setup.secret}</code>
                                </p>
                            </div>
                            <form onSubmit={confirm} className="space-y-2">
                                <Label htmlFor="code">2. Enter the 6-digit code it shows</Label>
                                <div className="flex max-w-xs gap-2">
                                    <Input
                                        id="code"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={confirmForm.data.code}
                                        onChange={(e) => confirmForm.setData('code', e.target.value.replace(/\D/g, ''))}
                                        className="font-mono tracking-widest"
                                    />
                                    <Button disabled={confirmForm.processing || confirmForm.data.code.length !== 6}>Confirm</Button>
                                </div>
                                <InputError message={confirmForm.errors.code} />
                            </form>
                        </div>
                    )}

                    {enabled && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {recoveryCodesLeft === 0
                                    ? 'You have no recovery codes left. Generate new ones.'
                                    : `${recoveryCodesLeft} recovery code${recoveryCodesLeft === 1 ? '' : 's'} left.`}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => router.post(route('two-factor.recovery-codes'), {}, { preserveScroll: true })}
                                >
                                    New recovery codes
                                </Button>
                                {!required && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            if (window.confirm('Turn off two-factor authentication?')) {
                                                router.delete(route('two-factor.disable'), { preserveScroll: true });
                                            }
                                        }}
                                    >
                                        Turn off
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
