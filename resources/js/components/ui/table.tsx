import * as React from 'react';
import { cn } from '@/lib/utils';

const TableContext = React.createContext<{ dense?: boolean }>({});

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  dense?: boolean; // smaller paddings for dense lists
}

export function Table({ className, dense, ...props }: TableProps) {
  return (
    <TableContext.Provider value={{ dense }}>
      <table
        className={cn(
          'w-full text-sm text-[var(--foreground)]',
          className,
        )}
        {...props}
      />
    </TableContext.Provider>
  );
}

export function TableContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-x-auto rounded-md border border-border p-4', className)} {...props} />
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-[var(--muted)]/80 text-[var(--foreground)]/80', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b last:border-0 hover:bg-[var(--muted)]/40 odd:bg-[var(--muted)]/20 even:bg-transparent transition-colors',
        'transition-colors',
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { dense } = React.useContext(TableContext);
  return (
    <th
      className={cn(
        'text-left font-semibold text-[var(--foreground)]/80 uppercase tracking-wide text-xs',
        dense ? 'py-1.5 pr-3' : 'py-2.5 pr-4',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { dense } = React.useContext(TableContext);
  return (
    <td
      className={cn(
        'text-[var(--foreground)]/90',
        dense ? 'py-1.5 pr-3' : 'py-2.5 pr-4',
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn('mt-2 text-left text-xs text-muted-foreground', className)}
      {...props}
    />
  );
}
