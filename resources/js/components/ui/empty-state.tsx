import * as React from 'react';
import { Button } from './button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title = 'Nothing here yet', description = 'There is no data to display.', action, className }: EmptyStateProps) {
  return (
    <div className={`w-full border rounded-md p-8 text-center ${className || ''}`}>
      <div className="text-base font-medium">{title}</div>
      {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
