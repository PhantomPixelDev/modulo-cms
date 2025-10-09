import * as React from 'react';

interface SectionHeaderProps {
  title: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, actions, className }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-2 ${className || ''}`}>
      <h2 className="text-lg font-semibold tracking-tight text-foreground/90">{title}</h2>
      {actions ? <div className="flex gap-1.5 text-sm">{actions}</div> : null}
    </div>
  );
}
