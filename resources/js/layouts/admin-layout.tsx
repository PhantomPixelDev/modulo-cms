import { useTranslation } from '@/hooks/useTranslation';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { sectionMetadata } from '@/pages/dashboard/sectionMetadata';
import type { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
    description?: string;
}

export default function AdminLayout({ children, breadcrumbs, title, description }: AdminLayoutProps) {
    const { t } = useTranslation();
    const section = usePage().props.adminSection as string | undefined;
    const metadata = sectionMetadata(section, t);
    const useSection = section && metadata.known;
    return (
        <AppLayoutTemplate breadcrumbs={useSection ? metadata.breadcrumbs : (breadcrumbs ?? metadata.breadcrumbs)}>
            <Head>
                <title>{useSection ? metadata.title : (title ?? metadata.title)}</title>
                <meta name="robots" content="noindex, nofollow" />
                {description && <meta name="description" content={description} />}
            </Head>
            {children}
        </AppLayoutTemplate>
    );
}
