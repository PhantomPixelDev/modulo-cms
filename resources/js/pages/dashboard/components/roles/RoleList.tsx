 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { EmptyState } from '@/components/ui/empty-state';
 import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Role, Permission } from '../../types';

interface RoleListProps {
  roles: Role[];
  onEdit: (id: number) => void;
}

export function RoleList({ roles, onEdit }: RoleListProps) {
  if (!roles || roles.length === 0) {
    return (
      <EmptyState
        title="No roles"
        description="Create roles and assign permissions."
      />
    );
  }
  return (
    <TableContainer>
      <Table dense>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className="font-medium">{role.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.map((permission: Permission) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => onEdit(role.id)}
                  >
                    Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

