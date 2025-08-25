import * as React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type TaxonomyListItem = {
  id: number;
  name: string;
  label: string;
};

interface TaxonomyListProps {
  items: TaxonomyListItem[];
  canView?: boolean;
  canEdit?: boolean;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export function TaxonomyList({ items, canView = false, canEdit = false, onView, onEdit }: TaxonomyListProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState title="No taxonomies" description="Create a taxonomy to organize your content." />
    );
  }
  return (
    <TableContainer>
      <Table dense>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>{tx.name}</TableCell>
              <TableCell>{tx.label}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {canView && (
                    <Button variant="secondary" size="sm" onClick={() => onView?.(tx.id)}>View</Button>
                  )}
                  {canEdit && (
                    <Button size="sm" onClick={() => onEdit?.(tx.id)}>Edit</Button>
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
