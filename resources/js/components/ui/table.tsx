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
          'w-full caption-bottom text-sm text-foreground',
          className,
        )}
        {...props}
      />
    </TableContext.Provider>
  );
}

export function TableContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border bg-card shadow-xs', className)} {...props} />
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-muted/50 [&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b transition-colors last:border-0 hover:bg-muted/40 data-[state=selected]:bg-muted',
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
        'whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-muted-foreground first:pl-4 last:pr-4',
        dense ? 'h-8' : 'h-10',
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
        'px-3 align-middle first:pl-4 last:pr-4',
        dense ? 'py-1.5' : 'py-3',
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
