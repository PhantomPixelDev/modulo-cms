import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Layout from './Layout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

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
    <Layout title="Confirm password">
      <Head title="Confirm password" />

      <div className="py-16">
        <div className="mx-auto max-w-md">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Confirm your password</h1>
          <p className="mb-8 text-muted-foreground">This is a secure area of the application. Please confirm your password before continuing.</p>

          <form className="space-y-6" onSubmit={submit}>
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
    </Layout>
  );
}
