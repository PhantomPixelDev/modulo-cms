import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TextLink from '@/components/text-link';
import InputError from '@/components/input-error';

interface Props {
  canResetPassword?: boolean;
  status?: string;
}

export default function Login({ canResetPassword = true, status }: Props) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  return (
    <AuthLayout title="Log in">
      <Head title="Log in" />

      <div className="py-6">
        <div className="">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mb-8 text-muted-foreground">Enter your email and password to sign in</p>

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

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {canResetPassword && (
                  <TextLink href={route('password.request')} className="ml-auto text-sm">
                    Forgot password?
                  </TextLink>
                )}
              </div>
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

            <div className="flex items-center space-x-3">
              <Checkbox
                id="remember"
                checked={data.remember}
                onClick={() => setData('remember', !data.remember)}
              />
              <Label htmlFor="remember">Remember me</Label>
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Log in
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <TextLink href={route('register')}>Sign up</TextLink>
            </p>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
