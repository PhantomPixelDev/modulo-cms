import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react';
import type { User } from '@/types';

interface UserListProps {
  users: Array<{
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at: string;
    updated_at: string;
    roles?: Array<{ id: number; name: string }>;
  }>;
  onEdit: (id: number) => void;
  onRoleChange?: (userId: number, roleId: number, action: 'assign' | 'remove') => void;
  currentUserId?: number;
  canEditUsers?: boolean;
  canDeleteUsers?: boolean;
  canManageRoles?: boolean;
}

export function UserList({ 
  users, 
  onEdit, 
  onRoleChange = () => {}, 
  currentUserId = -1,
  canEditUsers = false,
  canDeleteUsers = false,
  canManageRoles = false
}: UserListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Roles</th>
            <th className="py-2 pr-4">Joined</th>
            <th className="py-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b last:border-b-0 hover:bg-accent dark:hover:bg-gray-800">
              <td className="py-2 pr-4">{user.name}</td>
              <td className="py-2 pr-4">{user.email}</td>
              <td className="py-2 pr-4">
                <div className="flex flex-wrap gap-1">
                  {user.roles?.map((role) => (
                    <Badge key={role.id} variant="outline">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="py-2 pr-4">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="py-2 pr-4">
                <div className="flex space-x-1">
                  {canEditUsers && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => onEdit(user.id)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEditUsers && (
                        <DropdownMenuItem onClick={() => onEdit(user.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canManageRoles && (
                        <DropdownMenuItem onClick={() => {/* Handle role management */}}>
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Roles
                        </DropdownMenuItem>
                      )}
                      {canDeleteUsers && user.id !== currentUserId && (
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                              router.delete(route('dashboard.admin.users.destroy', user.id), {
                                onSuccess: () => {},
                                onError: () => {},
                                preserveScroll: true,
                                preserveState: true,
                              });
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
