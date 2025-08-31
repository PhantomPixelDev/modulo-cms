import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

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
};

export function DataTable<T>({
  data,
  columns,
  actions,
  itemsPerPage = 10,
  searchFields = [],
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string; direction: 'asc' | 'desc' | null } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
          return value && String(value).toLowerCase().includes(term);
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

  return (
    <div className="space-y-4">
      {searchFields.length > 0 && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
        </div>
      )}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
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
