import { ReactNode } from 'react';
import { SectionHeader } from '@/components/ui/section-header';

interface SectionWrapperProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionWrapper({ 
  title, 
  children, 
  actions, 
  className = '' 
}: SectionWrapperProps) {
  return (
    <div className={`px-4 py-6 ${className}`}>
      <SectionHeader title={title} actions={actions} /> 
      {children}
    </div>
  );
}
