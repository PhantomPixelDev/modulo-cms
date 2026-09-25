import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function TwoFactorChallenge() {
    const [useRecovery, setUseRecovery] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ code: '', recovery_code: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.login.store'), { onFinish: () => reset() });
    };

    const toggle = () => {
        setUseRecovery((value) => !value);
        clearErrors();
        reset();
    };

    return (
        <AuthLayout
            title="Two-factor authentication"
            description={
                useRecovery
                    ? 'Enter one of the recovery codes you saved when you set up two-factor authentication.'
                    : 'Enter the 6-digit code from your authenticator app.'
            }
        >
            <Head title="Two-factor authentication" />

            <form onSubmit={submit} className="space-y-6">
                {useRecovery ? (
                    <div className="grid gap-2">
                        <Label htmlFor="recovery_code">Recovery code</Label>
                        <Input
                            id="recovery_code"
                            name="recovery_code"
                            autoComplete="one-time-code"
                            autoFocus
                            value={data.recovery_code}
                            onChange={(e) => setData('recovery_code', e.target.value)}
                            placeholder="XXXXXXXX-XXXXXXXX"
                        />
                        <InputError message={errors.recovery_code} />
                    </div>
                ) : (
                    <div className="grid gap-2">
                        <Label htmlFor="code">Code</Label>
                        <Input
                            id="code"
                            name="code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            maxLength={6}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="text-center font-mono text-lg tracking-[0.5em]"
                        />
                        <InputError message={errors.code} />
                    </div>
                )}

                <Button className="w-full" disabled={processing}>
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    Continue
                </Button>

                <button type="button" onClick={toggle} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                    {useRecovery ? 'Use an authenticator code instead' : 'Lost your device? Use a recovery code'}
                </button>
            </form>
        </AuthLayout>
    );
}
