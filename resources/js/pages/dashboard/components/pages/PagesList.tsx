import * as React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type PageListItem = {
  id: number;
  title: string;
  status: string;
  created_at: string;
  author?: { id: number; name: string } | null;
};

interface PagesListProps {
  pages: PageListItem[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (page: PageListItem) => void;
}

export function PagesList({ pages, canEdit = false, canDelete = false, onEdit, onDelete }: PagesListProps) {
  if (!pages || pages.length === 0) {
    return (
      <EmptyState title="No pages" description="Create a page to get started." />
    );
  }
  return (
    <TableContainer>
      <Table dense>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((pg) => (
            <TableRow key={pg.id}>
              <TableCell>{pg.title}</TableCell>
              <TableCell>{pg.status}</TableCell>
              <TableCell>{pg.author?.name || '—'}</TableCell>
              <TableCell>{new Date(pg.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {canEdit && (
                    <Button size="sm" onClick={() => onEdit?.(pg.id)}>Edit</Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => onDelete?.(pg)}>Delete</Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
