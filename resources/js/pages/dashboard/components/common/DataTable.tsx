import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, Search, Grid, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DataTableProps<T> = {
  data: T[];
  columns: {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    render?: (item: T, value: any) => React.ReactNode;
  }[];
  actions?: (item: T) => React.ReactNode;
  itemsPerPage?: number;
  searchFields?: (keyof T)[];
  mobileBreakpoint?: 'sm' | 'md' | 'lg';
};

export function DataTable<T>({
  data,
  columns,
  actions,
  itemsPerPage = 10,
  searchFields = [],
  mobileBreakpoint = 'md',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' | null } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const stringifyForSearch = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);

    // Arrays: prefer common label fields when present
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (v === null || v === undefined) return '';
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
          if (typeof v === 'object') return (v as any).name ?? (v as any).label ?? '';
          return '';
        })
        .filter(Boolean)
        .join(' ');
    }

    // Objects: prefer common label fields
    if (typeof value === 'object') {
      return (value as any).name ?? (value as any).label ?? '';
    }

    return '';
  };

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return null;

    // React nodes should render as-is
    if (React.isValidElement(value)) return value;

    // Primitive values
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    // Arrays: render React nodes directly when possible, otherwise comma-separated using common fields
    if (Array.isArray(value)) {
      if (value.every((v) => React.isValidElement(v))) {
        return <>{value}</>;
      }

      const parts = value
        .map((v) => {
          if (v === null || v === undefined) return '';
          if (React.isValidElement(v)) return '';
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
          if (typeof v === 'object') return (v as any).name ?? (v as any).label ?? '';
          return '';
        })
        .filter(Boolean);

      return parts.join(', ');
    }

    // Objects: render a sensible label if possible
    if (typeof value === 'object') {
      return (value as any).name ?? (value as any).label ?? '';
    }

    return null;
  };

  // Set initial view mode based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobile = window.innerWidth < (mobileBreakpoint === 'sm' ? 640 : mobileBreakpoint === 'md' ? 768 : 1024);
      setViewMode(isMobile ? 'cards' : 'table');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [mobileBreakpoint]);

  const handleSort = (key: keyof T | string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return { key, direction: null };
    });
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    if (searchTerm && searchFields.length > 0) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          const str = stringifyForSearch(value);
          return str && str.toLowerCase().includes(term);
        })
      );
    }
    if (sortConfig && sortConfig.direction) {
      result.sort((a, b) => {
        const valueA = a[sortConfig.key as keyof T];
        const valueB = b[sortConfig.key as keyof T];
        if (valueA === null || valueA === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valueB === null || valueB === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortConfig.direction === 'asc'
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        return 0;
      });
    }
    return result;
  }, [data, searchTerm, searchFields, sortConfig]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const renderMobileCard = (item: T, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {columns.slice(0, 2).map((col) => {
              const raw = item[col.key as keyof T];
              const value = col.render ? col.render(item, raw) : raw;
              const rendered = React.isValidElement(value) ? value : renderValue(value);
              return (
                <div key={String(col.key)} className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{col.label}:</span>
                  <div className="mt-1">{rendered}</div>
                </div>
              );
            })}
          </div>
          {actions && (
            <div className="ml-4">
              {actions(item)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {columns.slice(2).map((col) => {
            const raw = item[col.key as keyof T];
            const value = col.render ? col.render(item, raw) : raw;
            const rendered = React.isValidElement(value) ? value : renderValue(value);
            return (
              <div key={String(col.key)}>
                <span className="font-medium text-muted-foreground">{col.label}:</span>
                <div className="mt-1">{rendered}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {searchFields.length > 0 && (
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* View Mode Toggle - Available on all screen sizes */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Table</span>
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Grid className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Cards</span>
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <TableContainer>
          <Table dense>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={String(col.key)}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={col.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortConfig?.key === col.key && (
                        <span className="text-xs">
                          {sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-muted-foreground">
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={index}>
                    {columns.map((col) => (
                      <TableCell key={String(col.key)}>
                        {col.render ? col.render(item, item[col.key as keyof T]) : item[col.key as keyof T] as React.ReactNode}
                      </TableCell>
                    ))}
                    {actions && <TableCell>{actions(item)}</TableCell>}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Card View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {paginatedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data found
            </div>
          ) : (
            paginatedData.map((item, index) => renderMobileCard(item, index))
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
