import { ReactNode } from 'react';
import { SectionHeader } from '@/components/ui/section-header';

interface SectionWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionWrapper({ 
  title, 
  description,
  children, 
  actions, 
  className = '' 
}: SectionWrapperProps) {
  return (
    <div className={`px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto ${className}`}>
      <SectionHeader title={title} description={description} actions={actions} /> 
      {children}
    </div>
  );
}
