import { ThemeBrand, type BrandSite } from '@/components/theme-brand';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ThemeSettingValues } from '@/theme-settings';
import { Head, Link, usePage } from '@inertiajs/react';
import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
    const { site, theme } = usePage().props as { site?: BrandSite; theme?: { settings?: ThemeSettingValues } };
    const siteName = site?.name || 'Modulo CMS';
    const pageTitle = title ? `${title} | ${siteName}` : siteName;

    useDocumentTitle(pageTitle);

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
                {description && <meta name="description" content={description} />}
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12 text-foreground">
                <Link href="/" className="mb-8 inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight">
                    <ThemeBrand site={site} values={theme?.settings} />
                </Link>
                <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>
            </div>
        </>
    );
}
