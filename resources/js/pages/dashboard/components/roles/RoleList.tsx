import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Role, Permission } from '../../types';

interface RoleListProps {
  roles: Role[];
  onEdit: (id: number) => void;
}

export function RoleList({ roles, onEdit }: RoleListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Permissions</th>
            <th className="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b last:border-b-0 hover:bg-accent dark:hover:bg-gray-800">
              <td className="py-2 pr-4 font-medium">{role.name}</td>
              <td className="py-2 pr-4">
                <div className="flex flex-wrap gap-1">
                  {role.permissions?.map((permission: Permission) => (
                    <Badge key={permission.id} variant="outline" className="text-xs">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="py-2 pr-4">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
