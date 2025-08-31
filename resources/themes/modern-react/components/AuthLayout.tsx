import React from 'react';
import { Head } from '@inertiajs/react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const pageTitle = title ? `${title} | Modulo CMS` : 'Modulo CMS';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
