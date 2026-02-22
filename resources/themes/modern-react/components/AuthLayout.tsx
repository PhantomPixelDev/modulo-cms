import React from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  const pageProps = usePage().props as any;
  const theme = pageProps?.theme;
  const site = pageProps?.site;

  // Extract theme colors with fallbacks
  const backgroundColor = theme?.colors?.background || '#ffffff';
  const surfaceColor = theme?.colors?.surface || '#f8fafc';
  const textPrimary = theme?.colors?.text_primary || '#1a202c';
  const textMuted = theme?.colors?.text_muted || '#64748b';
  const primaryColor = theme?.colors?.primary || '#3b82f6';

  const pageTitle = title ? `${title} | ${site?.name || 'Modulo CMS'}` : site?.name || 'Modulo CMS';

  useDocumentTitle(pageTitle);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          body {
            background-color: ${backgroundColor};
            color: ${textPrimary};
          }
          .auth-container {
            background-color: ${surfaceColor};
            color: ${textPrimary};
          }
          .text-muted-foreground {
            color: ${textMuted} !important;
          }
          .btn-primary {
            background-color: ${primaryColor} !important;
            border-color: ${primaryColor} !important;
          }
        `}</style>
      </Head>

      <div className="min-h-screen auth-container" style={{ backgroundColor, color: textPrimary }}>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border p-8 shadow-lg" style={{ backgroundColor: surfaceColor }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
