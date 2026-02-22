import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from './AuthLayout';

import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
  status?: string;
}

export default function VerifyEmail({ status }: Props) {
  const { t } = useTranslation();
  const { post, processing } = useForm({});

  const resend = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('verification.send'));
  };

  return (
    <AuthLayout title={t('theme.auth.verify_email.title', {}, 'Verify your email')}>
      <Head title={t('theme.auth.verify_email.head', {}, 'Verify Email')} />

      <div className="py-6">
        <div className="">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('theme.auth.verify_email.heading', {}, 'Verify your email')}</h1>
          <p className="mb-6 text-muted-foreground">
            {t('theme.auth.verify_email.description', {}, 'Thanks for signing up! Before getting started, please verify your email address by clicking on the link we just emailed to you. If you didn’t receive the email, we can send you another.')}
          </p>

          {status === 'verification-link-sent' && (
            <div className="mb-6 rounded-md bg-green-50 p-3 text-sm text-green-700">
              {t('theme.auth.verify_email.resent_message', {}, 'A new verification link has been sent to your email address.')}
            </div>
          )}

          <form onSubmit={resend} className="flex gap-3">
            <Button type="submit" disabled={processing}>{t('theme.auth.verify_email.resend_button', {}, 'Resend Verification Email')}</Button>
            <a href={route('logout')} className="text-sm text-muted-foreground" onClick={(e) => { e.preventDefault(); post(route('logout')); }}>
              {t('theme.auth.verify_email.logout', {}, 'Log out')}
            </a>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
