import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import SEOHead from '@/components/SEOHead';

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
    description?: string;
}

export default ({ children, breadcrumbs = [], title, description, ...props }: AdminLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <SEOHead title={title ?? 'Admin'} description={description} noindex />
        {children}
    </AppLayoutTemplate>
); 