import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthLayout from './AuthLayout';

import { Button } from '@/components/ui/button';

interface Props {
  status?: string;
}

export default function VerifyEmail({ status }: Props) {
  const { post, processing } = useForm({});

  const resend = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('verification.send'));
  };

  return (
    <AuthLayout title="Verify your email">
      <Head title="Verify Email" />

      <div className="py-6">
        <div className="">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Verify your email</h1>
          <p className="mb-6 text-muted-foreground">
            Thanks for signing up! Before getting started, please verify your email address by clicking on the link we just
            emailed to you. If you didn’t receive the email, we can send you another.
          </p>

          {status === 'verification-link-sent' && (
            <div className="mb-6 rounded-md bg-green-50 p-3 text-sm text-green-700">
              A new verification link has been sent to your email address.
            </div>
          )}

          <form onSubmit={resend} className="flex gap-3">
            <Button type="submit" disabled={processing}>Resend Verification Email</Button>
            <a href={route('logout')} className="text-sm text-muted-foreground" onClick={(e) => { e.preventDefault(); post(route('logout')); }}>
              Log out
            </a>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}
