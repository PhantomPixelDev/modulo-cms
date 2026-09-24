import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import AuthLayout from './AuthLayout';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Confirm password">
            <Head title="Confirm password" />

            <div>
                <div>
                    <h1 className="mb-1.5 text-2xl font-semibold tracking-tight">Confirm your password</h1>
                    <p className="mb-8 text-sm text-muted-foreground">
                        This is a secure area of the application. Please confirm your password before continuing.
                    </p>

                    <form className="space-y-5" onSubmit={submit}>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            Confirm password
                        </Button>
                    </form>
                </div>
            </div>
        </AuthLayout>
    );
}
