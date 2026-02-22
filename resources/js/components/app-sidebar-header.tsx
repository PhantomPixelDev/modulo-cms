import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { LocaleSwitcher } from '@/components/locale-switcher';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <Button asChild variant="outline" size="sm" className="gap-2">
                    <Link href="/" target="_blank" rel="noopener noreferrer">
                        <span>View Website</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        </header>
    );
}
