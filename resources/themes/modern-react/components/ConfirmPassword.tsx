import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import Layout from './Layout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useTranslation } from '@/hooks/useTranslation';

export default function ConfirmPassword() {
  const { t } = useTranslation();
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
    <Layout title={t('theme.auth.confirm_password.title', {}, 'Confirm password')}>
      <Head title={t('theme.auth.confirm_password.head', {}, 'Confirm password')} />

      <div className="py-16">
        <div className="mx-auto max-w-md">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('theme.auth.confirm_password.heading', {}, 'Confirm your password')}</h1>
          <p className="mb-8 text-muted-foreground">{t('theme.auth.confirm_password.description', {}, 'This is a secure area of the application. Please confirm your password before continuing.')}</p>

          <form className="space-y-6" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="password">{t('theme.auth.confirm_password.password_label', {}, 'Password')}</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                placeholder={t('theme.auth.confirm_password.password_placeholder', {}, '••••••••')}
              />
              <InputError message={errors.password} />
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              {t('theme.auth.confirm_password.submit', {}, 'Confirm password')}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
