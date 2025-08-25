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
          'w-full text-sm',
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
  return <thead className={cn('bg-muted/30', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b last:border-0 hover:bg-accent/50',
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
        'text-left font-medium text-muted-foreground',
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
