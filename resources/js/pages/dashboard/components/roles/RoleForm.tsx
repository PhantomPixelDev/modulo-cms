import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/ui/button-groups';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Role, Permission } from '../../types';

interface RoleFormProps {
  role?: Role;
  allPermissions: Permission[];
  isEditing: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function RoleForm({ role, allPermissions, isEditing, onSubmit, onCancel }: RoleFormProps) {
  const { data, setData, errors } = useForm({
    name: role?.name || '',
    permissions: role?.permissions?.map((p: Permission) => p.id) || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          className="mt-1 block w-full"
          placeholder="e.g., editor, author"
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div>
        <Label>Permissions</Label>
        <div className="mt-2 space-y-2">
          {allPermissions.map((permission) => (
            <div key={permission.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`permission-${permission.id}`}
                checked={data.permissions.includes(permission.id)}
                onChange={(e) => {
                  const newPermissions = e.target.checked
                    ? [...data.permissions, permission.id]
                    : data.permissions.filter((id: number) => id !== permission.id);
                  setData('permissions', newPermissions);
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label 
                htmlFor={`permission-${permission.id}`} 
                className="text-sm text-gray-700"
              >
                {permission.name}
              </label>
            </div>
          ))}
        </div>
        {errors.permissions && <p className="text-sm text-red-500 mt-1">{errors.permissions}</p>}
      </div>

      <ActionButtonGroup
        onSave={handleSubmit}
        onCancel={onCancel}
        saveLabel={isEditing ? 'Update Role' : 'Create Role'}
        cancelLabel="Cancel"
        className="mt-6"
      />
    </form>
  );
}
