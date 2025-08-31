import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import AuthLayout from './AuthLayout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TextLink from '@/components/text-link';
import InputError from '@/components/input-error';

export default function Register() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('register'));
  };

  return (
    <AuthLayout title="Create an account">
      <Head title="Register" />

      <div className="py-6">
        <div className="">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mb-8 text-muted-foreground">Join to start managing your content</p>

          <form className="space-y-6" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                type="text"
                required
                autoFocus
                autoComplete="name"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Jane Doe"
              />
              <InputError message={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="you@example.com"
              />
              <InputError message={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                placeholder="••••••••"
              />
              <InputError message={errors.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm password</Label>
              <Input
                id="password_confirmation"
                type="password"
                required
                autoComplete="new-password"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                placeholder="••••••••"
              />
              <InputError message={errors.password_confirmation} />
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <TextLink href={route('login')}>Log in</TextLink>
            </p>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
