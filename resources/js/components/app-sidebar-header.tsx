import { Breadcrumbs } from '@/components/breadcrumbs';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:rounded-t-xl">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1 text-muted-foreground" />
                <span className="h-4 w-px bg-border" aria-hidden="true" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <Button asChild variant="outline" size="sm">
                    <Link href="/" target="_blank" rel="noopener noreferrer">
                        <span className="hidden sm:inline">View Website</span>
                        <ExternalLink className="size-3.5" />
                    </Link>
                </Button>
            </div>
        </header>
    );
}
