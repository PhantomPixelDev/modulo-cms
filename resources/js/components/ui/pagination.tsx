import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className={cn('flex items-center justify-between gap-2 pt-4', className)} aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft aria-hidden="true" />
        Previous
      </Button>

      <div className="hidden items-center gap-1 md:flex">
        {getPageNumbers().map((page, i) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span key={`ellipsis-${i}`} className="inline-flex size-8 items-center justify-center text-muted-foreground">
                <MoreHorizontal className="size-4" />
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrent = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              variant={isCurrent ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={cn('size-8 px-0 tabular-nums', !isCurrent && 'text-muted-foreground')}
              aria-current={isCurrent ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}

export default Pagination;
