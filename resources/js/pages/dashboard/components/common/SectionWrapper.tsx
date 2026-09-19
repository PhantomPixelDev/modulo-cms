import { SectionHeader } from '@/components/ui/section-header';
import { ReactNode } from 'react';

interface SectionWrapperProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function SectionWrapper({ title, description, children, actions, className = '' }: SectionWrapperProps) {
    return (
        <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
            <SectionHeader title={title} description={description} actions={actions} />
            {children}
        </div>
    );
}
