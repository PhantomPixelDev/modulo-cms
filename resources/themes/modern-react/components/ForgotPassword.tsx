import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from './AuthLayout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

interface Props {
  status?: string;
}

export default function ForgotPassword({ status }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('password.email'));
  };

  return (
    <AuthLayout title="Forgot password">
      <Head title="Forgot password" />

      <div className="py-6">
        <div className="">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mb-6 text-muted-foreground">Enter your email to receive the password reset link.</p>

          {status && (
            <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">{status}</div>
          )}

          <form className="space-y-6" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="you@example.com"
              />
              <InputError message={errors.email} />
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              Send reset link
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
