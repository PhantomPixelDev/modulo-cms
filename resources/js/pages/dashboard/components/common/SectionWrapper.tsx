import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

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
    <div className={`px-4 py-6${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {actions && <div>{actions}</div>}
      </div>
      <Card>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
