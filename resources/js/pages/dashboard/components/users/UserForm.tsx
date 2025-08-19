import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

// Define the Role interface to match the backend
interface Role {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  [key: string]: any; // For any additional properties
}

export interface User {
  id: number;
  name: string;
  email: string;
  roles: Role[];
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles: number[];
  send_welcome_email: boolean;
  [key: string]: any;
}

export interface UserFormProps {
  user?: User;
  allRoles: Role[];
  isEditing: boolean;
  permissions?: Array<{ id: number; name: string }>;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  onRoleChange?: (userId: number, roleId: number, action: 'assign' | 'remove') => void;
  currentUserId?: number;
}


export function UserForm({ 
  user, 
  allRoles, 
  isEditing, 
  permissions = [], 
  onSubmit, 
  onCancel, 
  onRoleChange,
  currentUserId
}: UserFormProps) {
  const { data, setData, errors, processing } = useForm<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
    roles: user?.roles?.map(r => r.id) || [],
    send_welcome_email: false,
  });

  const [availableRoles, setAvailableRoles] = useState<Role[]>(allRoles);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(user?.roles || []);

  useEffect(() => {
    setAvailableRoles(allRoles.filter(role => 
      !selectedRoles.some(selected => selected.id === role.id)
    ));
  }, [allRoles, selectedRoles]);

  const handleRoleAdd = (role: Role) => {
    if (!selectedRoles.some(r => r.id === role.id)) {
      const newSelectedRoles = [...selectedRoles, role];
      setSelectedRoles(newSelectedRoles);
      setData('roles', newSelectedRoles.map(r => r.id));
      if (onRoleChange && user?.id) {
        onRoleChange(user.id, role.id, 'assign');
      }
    }
  };

  const handleRoleRemove = (roleId: number) => {
    const newSelectedRoles = selectedRoles.filter(role => role.id !== roleId);
    setSelectedRoles(newSelectedRoles);
    setData('roles', newSelectedRoles.map(r => r.id));
    if (onRoleChange && user?.id) {
      onRoleChange(user.id, roleId, 'remove');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new object with only the fields we want to submit
    const submitData: Partial<UserFormData> = { 
      name: data.name,
      email: data.email,
      roles: data.roles,
      send_welcome_email: data.send_welcome_email
    };
    
    // Only include password fields if they are being changed or it's a new user
    if (!isEditing || data.password) {
      submitData.password = data.password;
      submitData.password_confirmation = data.password_confirmation;
    }
    
    try {
      await onSubmit(submitData as UserFormData);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} user:`, error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="mt-1 block w-full"
              required
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              className="mt-1 block w-full"
              required
            />
            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
          </div>

          {!isEditing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="mt-1 block w-full"
                  required
                  minLength={8}
                />
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation"
                  type="password"
                  value={data.password_confirmation}
                  onChange={(e) => setData('password_confirmation', e.target.value)}
                  className="mt-1 block w-full"
                  required
                />
                {errors.password_confirmation && (
                  <p className="text-sm text-red-500 mt-1">{errors.password_confirmation}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="send_welcome_email"
                  checked={data.send_welcome_email}
                  onCheckedChange={(checked) => setData('send_welcome_email', Boolean(checked))}
                />
                <Label htmlFor="send_welcome_email">Send welcome email with login instructions</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Assigned Roles</Label>
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map(role => (
                  <Badge key={role.id} className="flex items-center gap-1">
                    {role.name}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRoleRemove(role.id)}
                      className="ml-1 h-5 w-5"
                      disabled={user?.id === currentUserId && role.name === 'admin'}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {availableRoles.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="add-role">Add Role</Label>
              <select
                id="add-role"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                onChange={(e) => {
                  const roleId = parseInt(e.target.value);
                  if (roleId) {
                    const role = availableRoles.find(r => r.id === roleId);
                    if (role) {
                      handleRoleAdd(role);
                      e.target.value = '';
                    }
                  }
                }}
                value=""
              >
                <option value="">Select a role to add</option>
                {availableRoles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={processing}
        >
          {processing ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
