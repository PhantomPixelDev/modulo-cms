import React, { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from './AuthLayout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  email: string;
  token: string;
}

export default function ResetPassword({ email, token }: Props) {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors } = useForm({
    token,
    email: email || '',
    password: '',
    password_confirmation: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('password.store'));
  };

  return (
    <AuthLayout title={t('theme.auth.reset_password.title', {}, 'Reset password')}>
      <Head title={t('theme.auth.reset_password.head', {}, 'Reset password')} />

      <div className="py-6">
        <div className="">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('theme.auth.reset_password.heading', {}, 'Set a new password')}</h1>
          <p className="mb-8 text-muted-foreground">{t('theme.auth.reset_password.description', {}, 'Enter a new password for your account.')}</p>

          <form className="space-y-6" onSubmit={submit}>
            <input type="hidden" name="token" value={data.token} />

            <div className="space-y-2">
              <Label htmlFor="email">{t('theme.auth.reset_password.email_label', {}, 'Email address')}</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder={t('theme.auth.reset_password.email_placeholder', {}, 'you@example.com')}
              />
              <InputError message={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('theme.auth.reset_password.password_label', {}, 'New password')}</Label>
              <Input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                placeholder={t('theme.auth.reset_password.password_placeholder', {}, '••••••••')}
              />
              <InputError message={errors.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">{t('theme.auth.reset_password.password_confirmation_label', {}, 'Confirm password')}</Label>
              <Input
                id="password_confirmation"
                type="password"
                required
                autoComplete="new-password"
                value={data.password_confirmation}
                onChange={(e) => setData('password_confirmation', e.target.value)}
                placeholder={t('theme.auth.reset_password.password_confirmation_placeholder', {}, '••••••••')}
              />
              <InputError message={errors.password_confirmation} />
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              {t('theme.auth.reset_password.submit', {}, 'Reset password')}
            </Button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
