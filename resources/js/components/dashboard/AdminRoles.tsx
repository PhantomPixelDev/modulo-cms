import React from "react";

import { Link } from '@inertiajs/react';
declare function route(name: string, ...params: any[]): string;
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Save, Plus, ArrowLeft, Edit } from "lucide-react";

type Permission = { id: number; name: string };
type Role = { id: number; name: string; permissions: Permission[] };
type RoleData = { name: string; permissions: number[] };
type AdminRolesProps = {
  roles: { data: Role[] };
  permissions: Permission[];
  roleData: RoleData;
  setRoleData: (field: string, value: any) => void;
  roleErrors: Record<string, string>;
  roleProcessing: boolean;
  handleCreateRole: (e: React.FormEvent) => void;
  adminSection: string;
};

export function AdminRoles({ roles, permissions, roleData, setRoleData, roleErrors, roleProcessing, handleCreateRole, adminSection }: AdminRolesProps) {
    if (adminSection === "roles.create") {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('dashboard.admin.roles.index')}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Roles
                        </Button>
                    </Link>
                    <h2 className="text-2xl font-bold">Create New Role</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Role Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateRole} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="role-name">Role Name</label>
                                <input
                                    id="role-name"
                                    value={roleData.name}
                                    onChange={(e) => setRoleData('name', e.target.value)}
                                    required
                                />
                                {roleErrors.name && (
                                    <p className="text-sm text-red-600">{roleErrors.name}</p>
                                )}
                            </div>
                            <div className="space-y-4">
                                <label>Permissions</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {permissions?.map((permission) => (
                                        <div key={permission.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`perm-${permission.id}`}
                                                checked={roleData.permissions.includes(permission.id)}
                                                onCheckedChange={(checked: boolean) => {
                                                    if (checked) {
                                                        setRoleData('permissions', [...roleData.permissions, permission.id]);
                                                    } else {
                                                        setRoleData('permissions', roleData.permissions.filter(id => id !== permission.id));
                                                    }
                                                }}
                                            />
                                            <label htmlFor={`perm-${permission.id}`} className="text-sm">
                                                {permission.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <Link href={route('dashboard.admin.roles.index')}>
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={roleProcessing}>
                                    <Save className="h-4 w-4 mr-2" />
                                    {roleProcessing ? 'Creating...' : 'Create Role'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }
    // roles list
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Role Management</h2>
                <Link href={route('dashboard.admin.roles.create')}>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Role
                    </Button>
                </Link>
            </div>
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Role Name</th>
                                    <th className="text-left py-3 px-4 font-medium">Permissions</th>
                                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles?.data.map((role) => (
                                    <tr key={role.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{role.name}</div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions.slice(0, 3).map((permission) => (
                                                    <Badge key={permission.id} variant="outline">
                                                        {permission.name}
                                                    </Badge>
                                                ))}
                                                {role.permissions.length > 3 && (
                                                    <Badge variant="outline">
                                                        +{role.permissions.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex space-x-2">
                                                <Link href={route('dashboard.admin.roles.edit', role.id)}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
