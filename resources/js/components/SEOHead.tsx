import { Head } from '@inertiajs/react';
import React from 'react';

export type SEOHeadProps = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  noindex?: boolean;
  og?: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
    siteName?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    image?: string;
  };
  children?: React.ReactNode;
};

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  robots,
  noindex,
  og,
  twitter,
  children,
}: SEOHeadProps) {
  const appName = (import.meta.env.VITE_APP_NAME as string) || 'Modulo CMS';

  const canonical = canonicalUrl ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : undefined);

  const ogTitle = og?.title ?? title ?? appName;
  const ogDescription = og?.description ?? description;
  const ogType = og?.type ?? 'website';
  const ogUrl = og?.url ?? canonical;
  const ogImage = og?.image;
  const ogSiteName = og?.siteName ?? appName;

  const twImage = twitter?.image ?? ogImage;
  const twCard = twitter?.card ?? (twImage ? 'summary_large_image' : 'summary');
  const twTitle = twitter?.title ?? title ?? appName;
  const twDescription = twitter?.description ?? description;

  const robotsContent = robots ?? (noindex ? 'noindex,nofollow' : undefined);

  return (
    <Head title={title}>
      {description && <meta key="desc" name="description" content={description} />}
      {canonical && <link key="canonical" rel="canonical" href={canonical} />}
      {robotsContent && <meta key="robots" name="robots" content={robotsContent} />}

      {/* OpenGraph */}
      {ogTitle && <meta key="og:title" property="og:title" content={ogTitle} />}
      {ogDescription && (
        <meta key="og:description" property="og:description" content={ogDescription} />
      )}
      {ogType && <meta key="og:type" property="og:type" content={ogType} />}
      {ogUrl && <meta key="og:url" property="og:url" content={ogUrl} />}
      {ogSiteName && (
        <meta key="og:site_name" property="og:site_name" content={ogSiteName} />
      )}
      {ogImage && <meta key="og:image" property="og:image" content={ogImage} />}

      {/* Twitter */}
      {twCard && <meta key="twitter:card" name="twitter:card" content={twCard} />}
      {twTitle && <meta key="twitter:title" name="twitter:title" content={twTitle} />}
      {twDescription && (
        <meta key="twitter:description" name="twitter:description" content={twDescription} />
      )}
      {twImage && <meta key="twitter:image" name="twitter:image" content={twImage} />}

      {children}
    </Head>
  );
}
