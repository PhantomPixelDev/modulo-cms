import { cn } from '@/lib/utils';
import * as React from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function SectionHeader({ title, description, actions, className }: SectionHeaderProps) {
    return (
        <div className={cn('mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end', className)}>
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
    );
}
