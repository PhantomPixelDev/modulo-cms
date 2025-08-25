import * as React from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export type PostTypeListItem = {
  id: number;
  name: string;
  label: string;
  route_prefix?: string | null;
};

interface PostTypeListProps {
  items: PostTypeListItem[];
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onView?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (item: PostTypeListItem) => void;
}

export function PostTypeList({ items, canView = false, canEdit = false, canDelete = false, onView, onEdit, onDelete }: PostTypeListProps) {
  if (!items || items.length === 0) {
    return (
      <EmptyState title="No post types" description="Create a post type to get started." />
    );
  }
  return (
    <TableContainer>
      <Table dense>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Route Prefix</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((pt) => (
            <TableRow key={pt.id}>
              <TableCell>{pt.name}</TableCell>
              <TableCell>{pt.label}</TableCell>
              <TableCell>{pt.route_prefix || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {canView && (
                    <Button variant="secondary" size="sm" onClick={() => onView?.(pt.id)}>View</Button>
                  )}
                  {canEdit && (
                    <Button size="sm" onClick={() => onEdit?.(pt.id)}>Edit</Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => onDelete?.(pt)}>Delete</Button>
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
