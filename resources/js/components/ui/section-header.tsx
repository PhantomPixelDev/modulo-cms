import * as React from 'react';

interface SectionHeaderProps {
  title: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, actions, className }: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className || ''}`}>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}
